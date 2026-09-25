import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { validateBriefAnalysis } from '@/lib/schemas/brief-analysis-schema';
import { DeterministicEvaluator } from '@/lib/services/deterministic-evaluator';
import { StructuredBriefAnalysis } from '@/types';
import { DEFAULT_OPERATOR_NAME } from '@/lib/operator-config';

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

    const currentAnalysis = await repo.getBriefAnalysis(id);
    const originalAnalysis = job.originalAnalysis || currentAnalysis;
    const editedAnalysis = job.editedAnalysis || currentAnalysis;

    return NextResponse.json({
      success: true,
      originalAnalysis,
      editedAnalysis,
      isHumanEdited: !!job.editedAnalysis?.isHumanEdited,
      job,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analysis comparison' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { editedAnalysis, action = 'save_draft', operatorNotes, operatorName = DEFAULT_OPERATOR_NAME } = body;

    const repo = getRepository();
    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Validate edited fields against schema
    const validation = validateBriefAnalysis(editedAnalysis);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: 'Validation failed on edited analysis', details: validation.errors },
        { status: 400 }
      );
    }

    // Re-evaluate deterministic pricing on the edited analysis
    const evalResult = DeterministicEvaluator.evaluate(
      {
        budget: job.budget,
        deadline: job.deadline,
        source: job.source,
        channelFeePct: job.channelFeePct,
        contingencyPct: job.contingencyPct,
        referenceAssets: job.referenceAssets,
        rawBrief: job.rawBrief,
      },
      validation.data
    );

    const now = new Date().toISOString();

    const finalEdited: StructuredBriefAnalysis = {
      ...validation.data,
      id: job.editedAnalysis?.id || `analysis-edited-${Date.now()}`,
      jobId: id,
      decision: action === 'approve' ? 'accept' : action === 'reject' ? 'reject' : evalResult.decision,
      deterministicDecision: evalResult.decision,
      deterministicReasons: evalResult.reasons,
      calculatedProductionCost: evalResult.calculatedProductionCost,
      calculatedGrossMargin: evalResult.expectedGrossMargin,
      calculatedMarginPct: evalResult.expectedMarginPct,
      modelUsed: job.originalAnalysis?.modelUsed || 'gpt-6-astra',
      analyzedAt: job.originalAnalysis?.analyzedAt || now,
      isHumanEdited: true,
      editedAt: now,
      editedBy: operatorName,

      // Backward compatibility fields
      dimensions: Array.from(new Set(validation.data.deliverables.map(d => `${d.aspectRatio} (${d.resolution})`))),
      durations: validation.data.deliverables.map(d => d.durationSeconds > 0 ? `${d.durationSeconds}s` : 'Still'),
      references: validation.data.suppliedAssets,
      exactText: validation.data.deliverables.flatMap(d => d.exactTextRequirements),
      missingInformation: validation.data.missingAssets,
      rightsConcerns: validation.data.rightsAndConsentFlags.map((rc, idx) => ({
        id: `rc-${idx + 1}`,
        severity: rc.severity,
        issue: rc.flag,
        mitigation: rc.details,
        requiresApproval: rc.severity === 'high' || rc.severity === 'medium',
        approved: action === 'approve',
      })),
      rationale: evalResult.reasons.join(' '),
    };

    // Keep original analysis untouched as true baseline
    const currentStoredAnalysis = await repo.getBriefAnalysis(id);
    const originalAnalysis = job.originalAnalysis || currentStoredAnalysis || finalEdited;

    // Update job status if action was approve or reject
    let nextStatus = job.status;
    const checkpoints = { ...job.approvalCheckpoints };

    if (action === 'approve') {
      nextStatus = 'Approved';
      checkpoints.workflowApproved = true;
      checkpoints.workflowApprovedAt = now;
      checkpoints.workflowApprovedBy = operatorName;
      checkpoints.rightsCleared = true;
      checkpoints.rightsApprovedAt = now;
      checkpoints.rightsApprovedBy = operatorName;
      if (!job.maxApprovedBudget) {
        checkpoints.maxBudgetApproved = true;
        checkpoints.maxBudgetAmount = Math.ceil(evalResult.totalCost * 1.5);
      }
    } else if (action === 'reject') {
      nextStatus = 'Rejected';
    }

    await repo.saveBriefAnalysis(finalEdited);

    const updatedJob = await repo.updateJob(id, {
      status: nextStatus,
      originalAnalysis,
      editedAnalysis: finalEdited,
      maxApprovedBudget: checkpoints.maxBudgetAmount || job.maxApprovedBudget,
      approvalCheckpoints: checkpoints,
      humanReviewApproved: action === 'approve',
      humanReviewApprovedAt: action === 'approve' ? now : undefined,
      humanReviewNotes: operatorNotes || job.humanReviewNotes,
    });

    return NextResponse.json({
      success: true,
      action,
      originalAnalysis,
      editedAnalysis: finalEdited,
      job: updatedJob,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save review analysis' },
      { status: 500 }
    );
  }
}
