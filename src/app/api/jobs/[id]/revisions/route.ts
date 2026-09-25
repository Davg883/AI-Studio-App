import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { Revision } from '@/types';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();
    const revisions = await repo.getRevisions(id);
    return NextResponse.json({ success: true, revisions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { clientNote, affectedDeliverable, recommendedAction, expectedIncrementalCost } = body;

    if (!clientNote || !affectedDeliverable) {
      return NextResponse.json(
        { success: false, error: 'Client note and affected deliverable are required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const revisionId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newRevision: Revision = {
      id: revisionId,
      jobId: id,
      clientNote,
      affectedDeliverable,
      recommendedAction: recommendedAction || 'Re-run affected model step with revised prompt and seed lock.',
      expectedIncrementalCost: Number(expectedIncrementalCost) || 0,
      approvalStatus: 'Pending Human Approval',
      createdAt: new Date().toISOString(),
    };

    const saved = await repo.addRevision(newRevision);

    // If job was in QA or Delivered, receiving revision puts it into Needs Review
    await repo.updateJob(id, { status: 'Needs Review' });

    return NextResponse.json({ success: true, revision: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record revision' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { revisionId, approvalStatus } = body;

    if (!revisionId || !approvalStatus) {
      return NextResponse.json(
        { success: false, error: 'revisionId and approvalStatus are required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const updated = await repo.updateRevision(revisionId, {
      approvalStatus,
      resolvedAt: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Revision not found' }, { status: 404 });
    }

    // If approved, optionally adjust maxApprovedBudget if incremental cost was needed
    if (approvalStatus === 'Approved' && updated.expectedIncrementalCost > 0) {
      const job = await repo.getJobById(id);
      if (job && job.maxApprovedBudget) {
        await repo.updateJob(id, {
          maxApprovedBudget: Number((job.maxApprovedBudget + updated.expectedIncrementalCost).toFixed(2)),
          status: 'Approved',
        });
      }
    }

    return NextResponse.json({ success: true, revision: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update revision' },
      { status: 500 }
    );
  }
}
