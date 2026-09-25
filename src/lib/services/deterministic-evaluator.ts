import { ValidatedBriefAnalysis } from '../schemas/brief-analysis-schema';
import { Job, AnalysisDecision } from '@/types';
import { getModelByCapability, HIGGSFIELD_MODELS } from '../constants';

export interface DeterministicEvaluationResult {
  decision: AnalysisDecision;
  reasons: string[];
  calculatedProductionCost: number;
  contingencyAmount: number;
  channelFeeAmount: number;
  totalCost: number;
  expectedGrossMargin: number;
  expectedMarginPct: number;
  missingPriceCapabilities: string[];
  stepCostBreakdown: Array<{
    stepName: string;
    capability: string;
    modelName: string;
    unitCost: number;
    attempts: number;
    stepTotal: number;
  }>;
}

export class DeterministicEvaluator {
  static evaluate(
    job: Pick<Job, 'budget' | 'deadline' | 'source' | 'channelFeePct' | 'contingencyPct' | 'referenceAssets' | 'rawBrief'>,
    analysis: ValidatedBriefAnalysis
  ): DeterministicEvaluationResult {
    const reasons: string[] = [];
    const missingPriceCapabilities: string[] = [];
    const stepCostBreakdown: DeterministicEvaluationResult['stepCostBreakdown'] = [];

    let totalProductionCost = 0;

    // 1. Calculate deterministic production cost using application's model catalog
    for (const step of analysis.proposedWorkflow) {
      const catalogItem = getModelByCapability(step.capabilityNeeded);

      if (!catalogItem || catalogItem.unitCostUSD === undefined || catalogItem.unitCostUSD === null) {
        missingPriceCapabilities.push(step.capabilityNeeded);
        reasons.push(
          `Missing catalog pricing for capability '${step.capabilityNeeded}'. Route to human review instead of guessing.`
        );
        continue;
      }

      // Use Astra's attempt estimate, bounded by safety limits
      const rawAttempts = analysis.estimatedAttemptsByStep?.[step.stepName] ?? catalogItem.avgAttempts;
      // Cap attempts between 1 and 8 to avoid runaway estimates
      const attempts = Math.max(1, Math.min(8, Number(rawAttempts) || catalogItem.avgAttempts));
      const stepTotal = Number((catalogItem.unitCostUSD * attempts).toFixed(2));

      totalProductionCost += stepTotal;

      stepCostBreakdown.push({
        stepName: step.stepName,
        capability: step.capabilityNeeded,
        modelName: catalogItem.name,
        unitCost: catalogItem.unitCostUSD,
        attempts,
        stepTotal,
      });
    }

    totalProductionCost = Number(totalProductionCost.toFixed(2));

    const contingencyPct = job.contingencyPct ?? 15;
    const channelFeePct = job.channelFeePct ?? 10;
    const clientBudget = job.budget || 0;

    const contingencyAmount = Number(((totalProductionCost * contingencyPct) / 100).toFixed(2));
    const channelFeeAmount = Number(((clientBudget * channelFeePct) / 100).toFixed(2));
    const totalCost = Number((totalProductionCost + contingencyAmount + channelFeeAmount).toFixed(2));

    const expectedGrossMargin = Number((clientBudget - totalCost).toFixed(2));
    const expectedMarginPct = clientBudget > 0
      ? Number(((expectedGrossMargin / clientBudget) * 100).toFixed(1))
      : 0;

    // Check textual flags for sensitive topics
    const allFlagsText = analysis.rightsAndConsentFlags
      .map(f => `${f.flag} ${f.details}`)
      .join(' ')
      .toLowerCase();

    const briefText = (job.rawBrief || '').toLowerCase();
    const technicalRisksText = analysis.technicalRisks.join(' ').toLowerCase();

    // ----------------------------------------------------
    // RULE 1: REJECTION CONDITIONS (Checked first)
    // ----------------------------------------------------

    // 1a. Deceptive impersonation / illegal deepfake / non-consensual cloning
    const hasDeceptiveImpersonation =
      analysis.rightsAndConsentFlags.some(
        f => f.flag.toLowerCase().includes('deceptive impersonation') ||
             f.details.toLowerCase().includes('deceptive impersonation') ||
             f.details.toLowerCase().includes('deepfake impersonation')
      ) ||
      briefText.includes('deceptive impersonation') ||
      briefText.includes('fake endorsement');

    if (hasDeceptiveImpersonation) {
      return {
        decision: 'reject',
        reasons: [
          'Deterministic Rejection: Job requires deceptive impersonation, deepfake misrepresentation, or non-consensual identity cloning, which violates studio ethical and safety policies.',
        ],
        calculatedProductionCost: totalProductionCost,
        contingencyAmount,
        channelFeeAmount,
        totalCost,
        expectedGrossMargin,
        expectedMarginPct,
        missingPriceCapabilities,
        stepCostBreakdown,
      };
    }

    // 1b. Technical impossibility / cannot deliver reliably
    const cannotDeliverReliably =
      technicalRisksText.includes('impossible') ||
      technicalRisksText.includes('unsupported by current generative video models') ||
      technicalRisksText.includes('unreliable delivery') ||
      (analysis.confidence < 30 && analysis.decision === 'reject');

    if (cannotDeliverReliably) {
      return {
        decision: 'reject',
        reasons: [
          'Deterministic Rejection: Technical scope cannot be reliably delivered with current generative video/audio models without extreme failure risk.',
        ],
        calculatedProductionCost: totalProductionCost,
        contingencyAmount,
        channelFeeAmount,
        totalCost,
        expectedGrossMargin,
        expectedMarginPct,
        missingPriceCapabilities,
        stepCostBreakdown,
      };
    }

    // 1c. Budget deficit: generation cost + contingency exceeds production budget
    const directGenCostWithContingency = totalProductionCost + contingencyAmount;
    if (directGenCostWithContingency > clientBudget || expectedGrossMargin < 0) {
      return {
        decision: 'reject',
        reasons: [
          `Deterministic Rejection: Calculated generation spend ($${totalProductionCost}) plus contingency ($${contingencyAmount}) = $${directGenCostWithContingency.toFixed(2)}, which exceeds the client budget ($${clientBudget.toFixed(2)}). Net deficit: -$${Math.abs(expectedGrossMargin).toFixed(2)}.`,
        ],
        calculatedProductionCost: totalProductionCost,
        contingencyAmount,
        channelFeeAmount,
        totalCost,
        expectedGrossMargin,
        expectedMarginPct,
        missingPriceCapabilities,
        stepCostBreakdown,
      };
    }

    // ----------------------------------------------------
    // RULE 2: HUMAN REVIEW CONDITIONS
    // ----------------------------------------------------
    const reviewReasons: string[] = [];

    // 2a. Missing required price data
    if (missingPriceCapabilities.length > 0) {
      reviewReasons.push(
        `Missing catalog pricing for capability: [${missingPriceCapabilities.join(', ')}]. Routed to human review instead of guessing prices.`
      );
    }

    // 2b. Exact logos, packaging text, trademarked branding
    const hasLogoOrPackagingText =
      analysis.rightsAndConsentFlags.some(
        f => f.severity !== 'low' && (
          f.flag.toLowerCase().includes('logo') ||
          f.flag.toLowerCase().includes('packaging') ||
          f.flag.toLowerCase().includes('trademark')
        )
      ) ||
      briefText.includes('exact logo') ||
      briefText.includes('exact packaging text');

    if (hasLogoOrPackagingText) {
      reviewReasons.push(
        'Human Review Required: Brief requires exact brand logos, packaging text, or registered trademark elements. Human verification of vector assets and client usage authorization required.'
      );
    }

    // 2c. Real person likeness or voice
    const hasLikenessOrVoice =
      analysis.rightsAndConsentFlags.some(
        f => f.severity !== 'low' && (
          f.flag.toLowerCase().includes('likeness') ||
          f.flag.toLowerCase().includes('real person') ||
          f.flag.toLowerCase().includes('celebrity') ||
          f.flag.toLowerCase().includes('voice clone') ||
          f.details.toLowerCase().includes('celebrity likeness')
        )
      ) ||
      briefText.includes('celebrity likeness') ||
      briefText.includes('actor likeness') ||
      briefText.includes('real person likeness');

    if (hasLikenessOrVoice) {
      reviewReasons.push(
        "Human Review Required: Project involves a real person's likeness, voice, or celebrity stylistic imitation. Human operator must verify written talent consent or clear synthetic archetype substitutes."
      );
    }

    // 2d. Factual claims / substantiation
    const hasFactualClaims =
      analysis.rightsAndConsentFlags.some(
        f => f.severity !== 'low' && (
          f.flag.toLowerCase().includes('factual claim') ||
          f.flag.toLowerCase().includes('medical claim') ||
          f.flag.toLowerCase().includes('clinical')
        )
      ) ||
      briefText.includes('clinically proven') ||
      briefText.includes('100% cure');

    if (hasFactualClaims) {
      reviewReasons.push(
        'Human Review Required: Creative copy contains factual, health, or clinical performance claims requiring client legal substantiation.'
      );
    }

    // 2e. Licensed music or soundalike tracks
    const hasLicensedMusic =
      analysis.rightsAndConsentFlags.some(
        f => f.severity !== 'low' && (
          f.flag.toLowerCase().includes('music') ||
          f.flag.toLowerCase().includes('soundalike') ||
          f.flag.toLowerCase().includes('song') ||
          f.details.toLowerCase().includes('soundalike')
        )
      ) ||
      briefText.includes('soundalike') ||
      briefText.includes('daft punk') ||
      briefText.includes('the weeknd') ||
      briefText.includes('hans zimmer');

    if (hasLicensedMusic) {
      reviewReasons.push(
        'Human Review Required: Audio direction requests licensed music or recognizable soundalike commercial tracks. Operator must clear commercial audio sync license.'
      );
    }

    // 2f. Unclear rights or high severity flags
    const hasUnclearRightsOrHighSeverity =
      analysis.rightsAndConsentFlags.some(
        f => f.severity === 'high' || f.flag.toLowerCase().includes('unclear rights')
      );

    if (hasUnclearRightsOrHighSeverity) {
      reviewReasons.push(
        'Human Review Required: High-severity intellectual property or unclear rights concern identified by analysis.'
      );
    }

    // 2g. Missing essential assets or high revision risk
    if (analysis.missingAssets.length >= 2) {
      reviewReasons.push(
        `Human Review Required: Missing critical client assets (${analysis.missingAssets.slice(0, 2).join(', ')}). Inquire before locking workflow.`
      );
    }

    if (analysis.revisionRisk === 'high') {
      reviewReasons.push(
        'Human Review Required: High revision risk detected due to ambiguous creative requirements. Operator should align with client first.'
      );
    }

    // 2h. Deadline feasibility check (< 3 days for multi-step production)
    const deadlineDate = new Date(job.deadline);
    const now = new Date();
    const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilDeadline < 2 && analysis.deliverables.length > 1) {
      reviewReasons.push(
        `Human Review Required: Tight turnaround (${daysUntilDeadline.toFixed(1)} days remaining) for ${analysis.deliverables.length} deliverables.`
      );
    }

    // 2i. Sub-optimal margin (< 45%)
    if (expectedMarginPct < 45) {
      reviewReasons.push(
        `Human Review Required: Expected gross margin (${expectedMarginPct}%) is below optimal target (>= 50%). Operator review recommended.`
      );
    }

    // If any human review reasons were triggered, return human_review!
    if (reviewReasons.length > 0) {
      return {
        decision: 'human_review',
        reasons: reviewReasons,
        calculatedProductionCost: totalProductionCost,
        contingencyAmount,
        channelFeeAmount,
        totalCost,
        expectedGrossMargin,
        expectedMarginPct,
        missingPriceCapabilities,
        stepCostBreakdown,
      };
    }

    // ----------------------------------------------------
    // RULE 3: ACCEPTANCE CONDITIONS
    // ----------------------------------------------------
    // Only accept when:
    // - Clear deliverables
    // - Enough reference material
    // - Plausible deadline
    // - Room for healthy margin (>= 50%)
    const hasClearDeliverables = analysis.deliverables.length >= 1;
    const hasEnoughReferences =
      analysis.suppliedAssets.length > 0 || (job.referenceAssets && job.referenceAssets.length > 0) || briefText.length > 200;
    const isPlausibleDeadline = daysUntilDeadline >= 2;
    const isHealthyMargin = expectedMarginPct >= 50 && expectedGrossMargin >= 100;

    if (hasClearDeliverables && hasEnoughReferences && isPlausibleDeadline && isHealthyMargin) {
      return {
        decision: 'accept',
        reasons: [
          `Deterministic Acceptance: Brief contains clear deliverable specifications, viable references, and a plausible timeline (${daysUntilDeadline.toFixed(1)} days).`,
          `Healthy Unit Economics: Expected gross margin is ${expectedMarginPct}% ($${expectedGrossMargin.toFixed(2)}) after ${channelFeePct}% ${job.source} fee and ${contingencyPct}% contingency buffer.`,
          `Catalog Compatibility: All ${stepCostBreakdown.length} workflow steps map cleanly to vetted Higgsfield/ElevenLabs model endpoints.`,
        ],
        calculatedProductionCost: totalProductionCost,
        contingencyAmount,
        channelFeeAmount,
        totalCost,
        expectedGrossMargin,
        expectedMarginPct,
        missingPriceCapabilities,
        stepCostBreakdown,
      };
    }

    // Fallback: If not cleanly qualifying for accept, route to human review
    return {
      decision: 'human_review',
      reasons: [
        'Human Review Required: Brief requires operator judgment regarding reference depth, delivery scope, or timeline alignment.',
      ],
      calculatedProductionCost: totalProductionCost,
      contingencyAmount,
      channelFeeAmount,
      totalCost,
      expectedGrossMargin,
      expectedMarginPct,
      missingPriceCapabilities,
      stepCostBreakdown,
    };
  }
}
