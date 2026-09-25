import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { SelfRepairEngine } from '@/lib/services/self-repair-engine';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const repairRuns = await repo.getRepairRuns(id);
    return NextResponse.json({ success: true, repairRuns });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch repair runs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const workflow = await repo.getWorkflow(id);
    if (!workflow || !workflow.steps.length) {
      return NextResponse.json({ success: false, error: 'No workflow found for job' }, { status: 400 });
    }

    const body = await req.json();
    const { stepId, generationId, customDefect } = body;

    const targetStep = workflow.steps.find(s => s.id === stepId) || workflow.steps[0];
    const generations = await repo.getGenerations(id);
    const targetGen =
      generations.find(g => g.id === generationId) ||
      generations.find(g => g.stepId === targetStep.id) || {
        id: `gen-temp-${Date.now()}`,
        jobId: job.id,
        stepId: targetStep.id,
        providerRequestId: 'req-sim-01',
        model: targetStep.selectedModel,
        status: 'Completed' as const,
        costEstimate: targetStep.estimatedTotalCost,
        outputType: 'image' as const,
        outputUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
        startedAt: new Date().toISOString(),
      };

    // 1. Run QA check against brief and reference assets
    const qaResult = await SelfRepairEngine.runQACheck(job, targetStep, targetGen, customDefect);

    if (qaResult.passed) {
      return NextResponse.json({
        success: true,
        message: 'QA Check Passed! No defects detected against reference assets.',
        qaResult,
      });
    }

    // 2. Execute Self-Repair Loop
    const currentSpend = workflow.steps.reduce((sum, s) => sum + (s.actualCost || 0), 0);
    const spendCeiling = job.maxApprovedBudget || workflow.maxApprovedSpend || 45.0;

    const repairRun = await SelfRepairEngine.executeRepairLoop(
      job,
      targetStep,
      targetGen,
      qaResult,
      currentSpend,
      spendCeiling
    );

    return NextResponse.json({
      success: true,
      message: repairRun.executedAutonomously
        ? `Defect in ${repairRun.qaResult.defectsDetected[0]?.component} repaired autonomously.`
        : `Defect escalated to operator: ${repairRun.escalationReason}`,
      repairRun,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Self-repair execution failed' },
      { status: 500 }
    );
  }
}
