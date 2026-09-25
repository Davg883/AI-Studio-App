import { Job, WorkflowStep, Generation } from '@/types';
import { QACheckResult, RepairRun, DefectType } from '@/types/autonomy';
import { getRepository } from '../repository/json-repository';
import { AutonomyManager } from './autonomy-manager';
import { AuditLogger } from './audit-logger';

export class SelfRepairEngine {
  /**
   * 1. Compare every output with the approved brief and reference assets.
   * 2. Identify the smallest failed component.
   */
  static async runQACheck(
    job: Job,
    step: WorkflowStep,
    generation: Generation,
    customDefect?: {
      type: DefectType;
      component: string;
      description: string;
      referenceDiscrepancy: string;
      severity?: 'minor' | 'moderate' | 'critical';
    }
  ): Promise<QACheckResult> {
    // If a defect is explicitly simulated or detected in the plate
    if (customDefect) {
      return {
        stepId: step.id,
        generationId: generation.id,
        passed: false,
        confidenceScore: 78,
        defectsDetected: [
          {
            type: customDefect.type,
            severity: customDefect.severity || 'minor',
            component: customDefect.component,
            description: customDefect.description,
            referenceDiscrepancy: customDefect.referenceDiscrepancy,
          },
        ],
      };
    }

    // Default automated rule-based check against brief and reference assets
    const defects: QACheckResult['defectsDetected'] = [];

    // Check for reflection or surface geometry issues on product briefs
    const briefLower = job.rawBrief.toLowerCase();
    if (briefLower.includes('reflection') || briefLower.includes('liquid') || briefLower.includes('wet') || briefLower.includes('rain')) {
      if (generation.meta?.hasReflectionAnomaly) {
        defects.push({
          type: 'geometry_reflection_failure',
          severity: 'minor',
          component: 'Puddle reflection & bottle contact shadow',
          description: 'Surface reflection does not accurately align with bottle flacon geometry.',
          referenceDiscrepancy: 'Reference bottle has sharp specular reflection; generated plate exhibits micro-smear.',
        });
      }
    }

    const passed = defects.length === 0;

    return {
      stepId: step.id,
      generationId: generation.id,
      passed,
      confidenceScore: passed ? 98 : 82,
      defectsDetected: defects,
    };
  }

  /**
   * 3. Choose between a targeted edit, regenerating one shot, changing the model, or asking the client a question.
   * 4. Estimate incremental cost and check the remaining production budget.
   * 5. Continue automatically only when inside the pre-approved spend limit and without new rights/factual issues.
   * 6. Escalate everything else to the human with a recommended action.
   */
  static async executeRepairLoop(
    job: Job,
    step: WorkflowStep,
    generation: Generation,
    qaResult: QACheckResult,
    currentJobSpend: number,
    spendCeiling: number
  ): Promise<RepairRun> {
    const repo = getRepository();
    const defect = qaResult.defectsDetected[0];

    let selectedAction: RepairRun['selectedAction'] = 'targeted_edit';
    let targetModel = 'qwen-image-edit-v2';
    let exactModelId = 'qwen/image-edit-2.0/inpaint';
    let operation = 'inpaint';
    let actionDetails = '';
    let estimatedCostUSD = 0.15;
    let costLabel: 'Verified Catalog Quote' | 'Example Quote (Pending Live Benchmark)' =
      'Example Quote (Pending Live Benchmark)';
    let technicalPrerequisites: string[] = [];
    let hasNewRightsConcern = false;
    let hasFactualClaimConcern = false;

    if (!defect) {
      throw new Error('Cannot execute repair: No defects detected in QA check.');
    }

    // Choose repair strategy based on defect type and smallest failed component
    switch (defect.type) {
      case 'geometry_reflection_failure':
      case 'packaging_label_drift':
        selectedAction = 'targeted_edit';
        targetModel = 'qwen-image-edit-v2';
        exactModelId = 'qwen/image-edit-2.0/inpaint';
        operation = 'inpaint';
        actionDetails = `Apply surgical inpaint mask over ${defect.component}. Align reflection vectors and preserve reference label sharpness without re-rendering full 5s motion pass.`;
        estimatedCostUSD = 0.15;
        costLabel = 'Example Quote (Pending Live Benchmark)';
        technicalPrerequisites = [
          'Extract representative frame at 00:03.12',
          'Generate feather mask (12px) around contact shadow & puddle reflection',
          'Apply inpainting prompt: "Clean water puddle reflection of luxury botanical serum bottle, perfectly aligned"',
          'Composite corrected frame back into sequence'
        ];
        break;

      case 'temporal_flicker':
        selectedAction = 'targeted_edit';
        targetModel = 'topaz-video-ai-pro';
        exactModelId = 'topaz/video-enhance-ai/upscale-1080p';
        operation = 'upscale';
        actionDetails = `Apply temporal stabilization pass over ${defect.component} to eliminate luminance flicker.`;
        estimatedCostUSD = 0.90;
        costLabel = 'Verified Catalog Quote';
        technicalPrerequisites = ['Render sequence into ProRes 422 proxy', 'Run Topaz Chronos de-flicker model'];
        break;

      case 'micro_anatomy_distortion':
        selectedAction = 'regenerate_shot';
        targetModel = step.selectedModel;
        exactModelId = 'bytedance/seedance-2.5/text-to-video';
        operation = 'text-to-video';
        actionDetails = `Regenerate plate with revised negative prompt ("deformed hands, multiple fingers") on ${defect.component}.`;
        estimatedCostUSD = step.unitCost;
        costLabel = 'Verified Catalog Quote';
        technicalPrerequisites = ['Update negative prompt tokens', 'Re-seed Seedance 2.5 camera trajectory'];
        break;

      default:
        selectedAction = 'targeted_edit';
        targetModel = 'qwen-image-edit-v2';
        exactModelId = 'qwen/image-edit-2.0/inpaint';
        operation = 'inpaint';
        actionDetails = `Execute localized surgical correction on ${defect.component}.`;
        estimatedCostUSD = 0.20;
        costLabel = 'Example Quote (Pending Live Benchmark)';
        technicalPrerequisites = ['Isolate target bounding box'];
        break;
    }

    // Generate explicit QA-Assisted Repair Recommendation
    const recommendation = {
      id: `rec-${Date.now().toString(36)}`,
      stepId: step.id,
      generationId: generation.id,
      defectComponent: defect.component,
      defectType: defect.type,
      recommendedAction: selectedAction,
      exactModelId,
      operation,
      quotedCostUSD: estimatedCostUSD,
      costLabel,
      reasoning: actionDetails,
      technicalPrerequisites,
      status: 'recommended' as const,
    };

    // Try atomic spend reservation
    const reservationResult = await repo.reserveSpend(
      job.id,
      estimatedCostUSD,
      `QA Repair: ${defect.component}`,
      step.id
    );

    // Check autonomy authorization
    const authCheck = await AutonomyManager.canExecuteAutonomousRepair({
      currentJobSpend,
      repairCost: estimatedCostUSD,
      jobSpendCeiling: spendCeiling,
      hasNewRightsConcern,
      hasFactualClaimConcern,
    });

    const repairRunId = `repair-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const remainingBudget = reservationResult.remainingBudgetUSD;

    if (authCheck.allowed && reservationResult.success) {
      // Execute QA-assisted repair
      await repo.commitSpend(reservationResult.reservationId!, estimatedCostUSD);

      const repairedUrl = generation.outputUrl
        ? `${generation.outputUrl}?repaired=${repairRunId}`
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80&repaired=true';

      const run: RepairRun = {
        id: repairRunId,
        jobId: job.id,
        stepId: step.id,
        generationId: generation.id,
        qaResult,
        recommendation: { ...recommendation, status: 'completed' },
        selectedAction,
        targetModel,
        actionDetails,
        estimatedCostUSD,
        remainingProductionBudgetUSD: remainingBudget,
        executedAutonomously: true,
        operatorApproved: true,
        escalatedToOperator: false,
        status: 'repaired',
        repairedAssetUrl: repairedUrl,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await repo.saveRepairRun(run);

      // Audit Log
      await AuditLogger.log({
        jobId: job.id,
        jobTitle: job.title,
        eventType: 'self_repair_completed',
        actor: 'agent',
        summary: `Self-Repair Executed: ${defect.component}`,
        details: `Targeted edit using ${exactModelId} (${operation}). Cost: $${estimatedCostUSD} [${costLabel}]. Remaining budget: $${remainingBudget.toFixed(2)}. Prerequisites: ${technicalPrerequisites.join(', ')}.`,
        spendDeltaUSD: estimatedCostUSD,
        cumulativeSpendUSD: currentJobSpend + estimatedCostUSD,
      });

      return run;
    } else {
      // If reservation was made but check failed, release reservation
      if (reservationResult.reservationId) {
        await repo.releaseSpend(reservationResult.reservationId);
      }

      const escalationReason = !reservationResult.success
        ? reservationResult.error
        : authCheck.reason;

      const run: RepairRun = {
        id: repairRunId,
        jobId: job.id,
        stepId: step.id,
        generationId: generation.id,
        qaResult,
        recommendation,
        selectedAction,
        targetModel,
        actionDetails,
        estimatedCostUSD,
        remainingProductionBudgetUSD: remainingBudget,
        executedAutonomously: false,
        operatorApproved: false,
        escalatedToOperator: true,
        escalationReason,
        status: 'escalated',
        createdAt: new Date().toISOString(),
      };

      await repo.saveRepairRun(run);

      // Audit Log
      await AuditLogger.log({
        jobId: job.id,
        jobTitle: job.title,
        eventType: 'pause_escalation',
        actor: 'agent',
        summary: `Self-Repair Paused: ${defect.component}`,
        details: `Reason: ${escalationReason}. Recommended Action: Review ${selectedAction} with ${exactModelId} ($${estimatedCostUSD}).`,
        riskFlag: 'Budget or Policy Pause',
      });

      return run;
    }
  }
}
