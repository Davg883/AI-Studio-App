import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { isConceptStep, MAX_CONCEPT_SELECTIONS } from '@/lib/concept-gate';
import { AuditLogger } from '@/lib/services/audit-logger';
import { DEFAULT_OPERATOR_NAME } from '@/lib/operator-config';

interface RouteContext {
  params: { id: string };
}

/** Records which concepts from a completed SEARCH step carry forward (human checkpoint). */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { stepId, generationIds, notes, operatorName = DEFAULT_OPERATOR_NAME } = body;

    const repo = getRepository();
    const job = await repo.getJobById(id);
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    const workflow = await repo.getWorkflow(id);
    const step = workflow?.steps.find(s => s.id === stepId);
    if (!workflow || !step) {
      return NextResponse.json({ success: false, error: 'Workflow step not found' }, { status: 404 });
    }
    if (!isConceptStep(step)) {
      return NextResponse.json({ success: false, error: 'This step is not a concept-selection step' }, { status: 400 });
    }
    if (step.status !== 'Completed') {
      return NextResponse.json({ success: false, error: 'Run the concept step before choosing concepts' }, { status: 409 });
    }

    const ids: string[] = Array.isArray(generationIds) ? Array.from(new Set(generationIds.map(String))) : [];
    if (ids.length < 1 || ids.length > MAX_CONCEPT_SELECTIONS) {
      return NextResponse.json(
        { success: false, error: `Choose between 1 and ${MAX_CONCEPT_SELECTIONS} concepts to carry forward` },
        { status: 400 }
      );
    }

    const stepGenerations = (await repo.getGenerations(id)).filter(
      g => g.stepId === step.id && g.status === 'Completed'
    );
    const unknown = ids.filter(gid => !stepGenerations.some(g => g.id === gid));
    if (unknown.length) {
      return NextResponse.json(
        { success: false, error: 'Selected concepts must be completed outputs of this step' },
        { status: 400 }
      );
    }

    const conceptSelection = {
      generationIds: ids,
      selectedBy: String(operatorName),
      selectedAt: new Date().toISOString(),
      ...(notes ? { notes: String(notes) } : {}),
    };
    await repo.updateWorkflowStep(id, step.id, { conceptSelection });

    await AuditLogger.log({
      jobId: id,
      jobTitle: job.title,
      eventType: 'human_approval',
      actor: 'human_operator',
      actorName: conceptSelection.selectedBy,
      summary: `Concepts selected: ${ids.length} carried forward from "${step.name}"`,
      details: `Operator chose ${ids.join(', ')} to carry into later production steps.`,
    });

    return NextResponse.json({ success: true, conceptSelection });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Could not record concept selection' },
      { status: 500 }
    );
  }
}
