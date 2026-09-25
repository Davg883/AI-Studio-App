import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { DEFAULT_OPERATOR_NAME } from '@/lib/operator-config';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { action, maxApprovedBudget, operatorName = DEFAULT_OPERATOR_NAME, notes } = body;

    const repo = getRepository();
    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const checkpoints = { ...job.approvalCheckpoints };

    if (action === 'approve_workflow_and_budget') {
      const budgetLimit = Number(maxApprovedBudget) || 50;

      checkpoints.workflowApproved = true;
      checkpoints.workflowApprovedAt = now;
      checkpoints.workflowApprovedBy = operatorName;
      checkpoints.maxBudgetApproved = true;
      checkpoints.maxBudgetAmount = budgetLimit;

      const wf = await repo.getWorkflow(id);
      if (wf) {
        wf.approvalStatus = 'Approved';
        wf.approvedBy = operatorName;
        wf.approvedAt = now;
        wf.maxApprovedSpend = budgetLimit;
        if (notes) wf.notes = notes;
        await repo.saveWorkflow(wf);
      }

      await repo.updateJob(id, {
        status: 'Approved',
        maxApprovedBudget: budgetLimit,
        approvalCheckpoints: checkpoints,
      });

      return NextResponse.json({
        success: true,
        message: `Workflow approved by ${operatorName}. Production budget ceiling locked at $${budgetLimit}.`,
        checkpoints,
      });
    }

    if (action === 'approve_rights') {
      checkpoints.rightsCleared = true;
      checkpoints.rightsApprovedAt = now;
      checkpoints.rightsApprovedBy = operatorName;

      const analysis = await repo.getBriefAnalysis(id);
      if (analysis) {
        if (analysis.rightsConcerns) {
          analysis.rightsConcerns = analysis.rightsConcerns.map(rc => ({ ...rc, approved: true }));
        }
        if (analysis.rightsAndConsentFlags) {
          analysis.rightsAndConsentFlags = analysis.rightsAndConsentFlags.map(rc => ({ ...rc, approved: true }));
        }
        await repo.saveBriefAnalysis(analysis);
      }

      await repo.updateJob(id, { approvalCheckpoints: checkpoints });

      return NextResponse.json({
        success: true,
        message: `Rights issues cleared by ${operatorName}.`,
        checkpoints,
      });
    }

    if (action === 'increase_budget') {
      const newLimit = Number(maxApprovedBudget);
      if (!newLimit || newLimit <= (job.maxApprovedBudget || 0)) {
        return NextResponse.json(
          { success: false, error: 'New budget limit must be greater than current ceiling' },
          { status: 400 }
        );
      }

      checkpoints.maxBudgetAmount = newLimit;
      await repo.updateJob(id, {
        maxApprovedBudget: newLimit,
        approvalCheckpoints: checkpoints,
      });

      return NextResponse.json({
        success: true,
        message: `Budget ceiling increased to $${newLimit} by ${operatorName}.`,
        checkpoints,
      });
    }

    if (action === 'approve_final_delivery') {
      // Final delivery must go through POST /api/jobs/[id]/deliver, which enforces the operator
      // signature token and deliverable verification. This shortcut used to bypass both.
      return NextResponse.json(
        {
          success: false,
          error: 'Final delivery requires a signed sign-off via /api/jobs/[id]/deliver.',
        },
        { status: 403 }
      );
    }

    if (action === 'reject_job') {
      await repo.updateJob(id, {
        status: 'Rejected',
        clientNotes: notes ? `${job.clientNotes || ''} | Rejection Rationale: ${notes}` : job.clientNotes,
      });

      return NextResponse.json({
        success: true,
        message: `Job marked as Rejected by ${operatorName}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown approval action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Approval action failed' },
      { status: 500 }
    );
  }
}
