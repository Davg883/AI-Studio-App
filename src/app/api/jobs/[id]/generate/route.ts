import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { GenerationRunner } from '@/lib/services/generation-runner';
import { OperatorGuardrails } from '@/lib/guardrails';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { action = 'run', stepId, generationId, runAll = false } = body;

    const repo = getRepository();
    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const workflow = await repo.getWorkflow(id);
    if (!workflow || !workflow.steps.length) {
      return NextResponse.json({ success: false, error: 'No workflow found for this job' }, { status: 400 });
    }

    const generations = await repo.getGenerations(id);

    // ACTION: CANCEL
    if (action === 'cancel') {
      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) {
        return NextResponse.json({ success: false, error: 'Workflow step not found' }, { status: 404 });
      }

      const targetGenId = generationId || step.generationId;
      const gen = generations.find(g => g.id === targetGenId);
      if (!gen) {
        return NextResponse.json({ success: false, error: 'Generation record not found to cancel' }, { status: 404 });
      }

      const { generation: canceledGen, updatedStep } = await GenerationRunner.cancelStep(job, step, gen);
      await repo.updateGeneration(gen.id, canceledGen);
      await repo.updateWorkflowStep(id, step.id, updatedStep);

      return NextResponse.json({
        success: true,
        message: 'Generation canceled',
        generation: canceledGen,
        updatedStep,
      });
    }

    // ACTION: RETRY
    if (action === 'retry') {
      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) {
        return NextResponse.json({ success: false, error: 'Workflow step not found' }, { status: 404 });
      }

      const targetGenId = generationId || step.generationId;
      const prevGen = generations.find(g => g.id === targetGenId) || {
        id: targetGenId || `gen-prev-${Date.now()}`,
        jobId: job.id,
        stepId: step.id,
        providerRequestId: '',
        model: step.selectedModel,
        status: 'Failed' as const,
        costEstimate: step.estimatedTotalCost,
        outputType: 'image' as const,
        startedAt: new Date().toISOString(),
      };

      const { generation: newGen, updatedStep } = await GenerationRunner.retryStep(job, step, prevGen);

      // Crucial: add new generation attempt to history without overwriting previous attempts
      await repo.addGeneration(newGen);
      await repo.updateWorkflowStep(id, step.id, updatedStep);

      return NextResponse.json({
        success: true,
        message: 'Step retry initiated',
        generation: newGen,
        updatedStep,
      });
    }

    // ACTION: RUN (Single step or run all)
    const analysis = await repo.getBriefAnalysis(id);
    const hasUnresolvedHighRights = analysis?.rightsConcerns?.some(
      rc => rc.severity === 'high' && !rc.approved
    ) || false;

    // Check guardrails before execution
    const guardrail = OperatorGuardrails.validateExecutionAuthorization(
      job,
      workflow.totalEstimatedCost,
      hasUnresolvedHighRights
    );

    if (!guardrail.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: guardrail.reason,
          requiredApproval: guardrail.requiredApproval,
        },
        { status: 403 }
      );
    }

    // Set job status to Generating if not already
    if (job.status !== 'Generating') {
      await repo.updateJob(id, { status: 'Generating' });
    }

    const results = [];
    const stepsToRun = runAll
      ? workflow.steps.filter(s => s.status !== 'Completed')
      : workflow.steps.filter(s => s.id === stepId || (!stepId && s.status !== 'Completed'));

    if (stepsToRun.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending steps to execute' });
    }

    for (let i = 0; i < stepsToRun.length; i++) {
      const step = stepsToRun[i];
      const { generation, updatedStep } = await GenerationRunner.executeStep(job, step, i);

      await repo.addGeneration(generation);
      await repo.updateWorkflowStep(id, step.id, updatedStep);
      results.push({ stepId: step.id, generationId: generation.id, status: generation.status });

      // If runAll wasn't specified, execute only the single requested step
      if (!runAll && stepId) {
        break;
      }
    }

    // Check if all steps are completed now
    const updatedWf = await repo.getWorkflow(id);
    const allCompleted = updatedWf?.steps.every(s => s.status === 'Completed');
    if (allCompleted) {
      await repo.updateJob(id, { status: 'QA' });
    }

    return NextResponse.json({
      success: true,
      executed: results,
      allCompleted,
      jobStatus: allCompleted ? 'QA' : 'Generating',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Generation execution failed' },
      { status: 500 }
    );
  }
}
