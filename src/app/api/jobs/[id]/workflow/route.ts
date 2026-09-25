import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { WorkflowPlanner } from '@/lib/services/workflow-planner';
import { ModelRouter } from '@/lib/services/model-router';
import { CAPABILITY_CATALOG } from '@/lib/models/capability-catalog';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();
    const workflow = await repo.getWorkflow(id);
    return NextResponse.json({
      success: true,
      workflow,
      catalog: CAPABILITY_CATALOG,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workflow' },
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

    let analysis = await repo.getBriefAnalysis(id);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Brief must be analyzed with GPT-6 Astra before building workflow' },
        { status: 400 }
      );
    }

    // Build transparent route through ModelRouter with job context
    const workflow = WorkflowPlanner.generateWorkflow(analysis, job);
    await repo.saveWorkflow(workflow);

    return NextResponse.json({ success: true, workflow });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { stepId, updates, notes, maxApprovedSpend, overrideModelId, attempts } = body;
    const repo = getRepository();

    const currentWf = await repo.getWorkflow(id);
    if (!currentWf) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    // Handle Manual Model Override
    if (stepId && overrideModelId) {
      const updatedWf = ModelRouter.overrideStepModel(currentWf, stepId, overrideModelId, attempts);
      await repo.saveWorkflow(updatedWf);
      return NextResponse.json({
        success: true,
        workflow: updatedWf,
        message: `Step ${stepId} model overridden to ${overrideModelId}. Economics recalculated instantly.`,
      });
    }

    if (stepId && updates) {
      const updated = await repo.updateWorkflowStep(id, stepId, updates);
      return NextResponse.json({ success: true, workflow: updated });
    }

    const updatedWf = {
      ...currentWf,
      notes: notes !== undefined ? notes : currentWf.notes,
      maxApprovedSpend: maxApprovedSpend !== undefined ? maxApprovedSpend : currentWf.maxApprovedSpend,
    };

    await repo.saveWorkflow(updatedWf);
    return NextResponse.json({ success: true, workflow: updatedWf });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

