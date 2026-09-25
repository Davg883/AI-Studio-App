import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { SOURCE_DEFAULT_FEES } from '@/lib/constants';
import { JobSource } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const storedJobs = await repo.getAllJobs();
    const jobs = await Promise.all(
      storedJobs.map(async job => {
        const [analysis, workflow] = await Promise.all([
          repo.getBriefAnalysis(job.id),
          repo.getWorkflow(job.id),
        ]);
        const hasOpenRightsIssue = !!analysis?.rightsConcerns?.some(
          rc => rc.severity === 'high' && !rc.approved
        );
        const productionComplete =
          !!workflow?.steps.length &&
          workflow.steps.every(step => step.status === 'Completed' || step.status === 'Skipped');
        return { ...job, hasOpenRightsIssue, productionComplete, workflowBuilt: !!workflow };
      })
    );
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, clientName, source, rawBrief, budget, deadline, clientNotes, referenceAssets, channelFeePct: requestedFeePct } = body;

    if (!rawBrief || !title) {
      return NextResponse.json(
        { success: false, error: 'Title and raw brief are required' },
        { status: 400 }
      );
    }

    const jobSource: JobSource = source || 'Upwork';
    const parsedBudget = Number(budget) || 0;
    // Operator may override the channel default at intake (e.g. a negotiated fee)
    const parsedFee = Number(requestedFeePct);
    const channelFeePct =
      requestedFeePct !== undefined && Number.isFinite(parsedFee) && parsedFee >= 0 && parsedFee <= 100
        ? parsedFee
        : SOURCE_DEFAULT_FEES[jobSource] ?? 10;

    const repo = getRepository();

    // Guard against double-submits / re-run scripts creating the same open job twice
    const normalize = (v: string) => (v || '').trim().toLowerCase();
    const existing = (await repo.getAllJobs()).find(
      j =>
        j.status !== 'Rejected' &&
        j.status !== 'Delivered' &&
        normalize(j.title) === normalize(title) &&
        normalize(j.clientName) === normalize(clientName || 'Anonymous Client') &&
        normalize(j.rawBrief) === normalize(rawBrief)
    );
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `An open job with this title, client and brief already exists (${existing.id}).`,
          existingJobId: existing.id,
        },
        { status: 409 }
      );
    }

    const newJob = await repo.createJob({
      title,
      clientName: clientName || 'Anonymous Client',
      source: jobSource,
      rawBrief,
      budget: parsedBudget,
      deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'New',
      clientNotes: clientNotes || '',
      referenceAssets: referenceAssets || [],
      channelFeePct,
      contingencyPct: 15,
      approvalCheckpoints: {
        workflowApproved: false,
        maxBudgetApproved: false,
        rightsCleared: false,
        finalDeliveryApproved: false,
      },
    });

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}
