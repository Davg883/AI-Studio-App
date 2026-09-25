import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { AIAnalyzer } from '@/lib/services/ai-analyzer';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const analysis = await AIAnalyzer.analyze({
      jobId: job.id,
      rawBrief: job.rawBrief,
      budget: job.budget,
      deadline: job.deadline,
      source: job.source,
      clientNotes: job.clientNotes,
      referenceAssets: job.referenceAssets,
      channelFeePct: job.channelFeePct,
      contingencyPct: job.contingencyPct,
    });

    // Save active analysis in store
    await repo.saveBriefAnalysis(analysis);

    // Update job record with both original and edited analysis copies for comparison
    let nextStatus = job.status;
    if (analysis.decision === 'reject') {
      nextStatus = 'Rejected';
    } else if (analysis.decision === 'human_review') {
      nextStatus = 'Needs Review';
    } else if (job.status === 'New') {
      nextStatus = 'Needs Review'; // Routed to review screen for human operator verification
    }

    await repo.updateJob(job.id, {
      status: nextStatus,
      originalAnalysis: analysis,
      editedAnalysis: JSON.parse(JSON.stringify(analysis)),
    });

    return NextResponse.json({
      success: true,
      analysis,
      decision: analysis.decision,
      rationale: analysis.rationale,
      deterministicDecision: analysis.deterministicDecision,
      deterministicReasons: analysis.deterministicReasons,
      jobStatus: nextStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Brief analysis failed' },
      { status: 500 }
    );
  }
}
