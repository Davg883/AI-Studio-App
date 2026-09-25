import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { CostCalculator } from '@/lib/services/cost-calculator';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const [analysis, workflow, generations, revisions] = await Promise.all([
      repo.getBriefAnalysis(id),
      repo.getWorkflow(id),
      repo.getGenerations(id),
      repo.getRevisions(id),
    ]);

    const profitability = CostCalculator.calculate(job, workflow, generations);
    const clientMemoryId = await repo.findClientMemoryIdByName(job.clientName);
    const originalAnalysis = job.originalAnalysis || analysis;
    const editedAnalysis = job.editedAnalysis || analysis;

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        originalAnalysis,
        editedAnalysis,
      },
      analysis: editedAnalysis || analysis,
      originalAnalysis,
      editedAnalysis,
      workflow,
      generations,
      revisions,
      profitability,
      clientMemoryId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const repo = getRepository();

    const updatedJob = await repo.updateJob(id, body);
    if (!updatedJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();
    const deleted = await repo.deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
