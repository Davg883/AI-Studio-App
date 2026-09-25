import { AutonomySettings, MessageType, MessageDispatchPolicy } from '@/types/autonomy';
import { Job } from '@/types';
import { getRepository } from '../repository/json-repository';
import { AuditLogger } from './audit-logger';

export const DEFAULT_AUTONOMY_SETTINGS: AutonomySettings = {
  totalAccountSpendLimitUSD: 1000.0,
  maxAutoSpendPerJob: 45.0,
  maxAutoSpendPerRepair: 15.0,
  maxGenerationAttemptsPerStep: 3,
  allowedModelFamilies: [
    'Seedream',
    'Seedance',
    'Soul',
    'Qwen',
    'Wan',
    'Topaz',
    'ElevenLabs',
    'Marketing Studio',
    'Ideogram',
    'Recraft',
    'MiniMax',
    'Kling',
    'Veo',
    'PixVerse',
    'LTX Video',
    'SubCaption',
    'Higgsfield Speak',
    'ByteDance',
  ],
  autoShareConcepts: false,
  finalDeliveryAlwaysRequiresApproval: true,
  dispatchPolicy: {
    intake_question: 'draft_for_approval',
    asset_request: 'draft_for_approval',
    scope_proposal: 'draft_for_approval',
    milestone_update: 'draft_for_approval',
    concept_presentation: 'draft_for_approval',
    revision_interpretation: 'draft_for_approval',
    change_order: 'draft_for_approval',
    final_delivery: 'draft_for_approval',
    retention_followup: 'draft_for_approval',
  },
  mandatoryPauseConditions: {
    likenessOrVoice: true,
    unclearAssetOwnership: true,
    factualAdvertisingClaims: true,
    exactPackagingRegulatedCopy: true,
    negativeExpectedMargin: true,
    missedDeadlineRisk: true,
    clientDispute: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

export class AutonomyManager {
  static async getSettings(): Promise<AutonomySettings> {
    const repo = getRepository();
    const stored = await repo.getAutonomySettings();
    return stored || DEFAULT_AUTONOMY_SETTINGS;
  }

  static async updateSettings(updates: Partial<AutonomySettings>, updatedBy = 'Operator'): Promise<AutonomySettings> {
    const repo = getRepository();
    const current = await this.getSettings();
    const updated: AutonomySettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    await repo.saveAutonomySettings(updated);

    await AuditLogger.log({
      jobId: 'system',
      eventType: 'model_decision',
      actor: 'human_operator',
      actorName: updatedBy,
      summary: 'Autonomy Settings Updated',
      details: `Operator updated autonomy policies. Max repair spend: $${updated.maxAutoSpendPerRepair}, Max job spend: $${updated.maxAutoSpendPerJob}.`,
    });

    return updated;
  }

  /**
   * Enforces marketplace safety and checks whether a message can be automatically dispatched
   * or must remain a draft for human approval.
   */
  static async canAutoSendMessage(channel: string, messageType: MessageType): Promise<{
    canSend: boolean;
    reason: string;
  }> {
    const isThirdPartyMarketplace =
      channel === 'upwork_safe_draft' ||
      channel === 'contra_safe_draft' ||
      channel === 'fiverr_safe_draft' ||
      channel.toLowerCase().includes('upwork') ||
      channel.toLowerCase().includes('contra') ||
      channel.toLowerCase().includes('fiverr');

    // Strict Marketplace Safety Invariant:
    // Never scrape, auto-apply, send a proposal, accept a contract, or message through
    // a 3rd-party marketplace without human approval.
    if (isThirdPartyMarketplace) {
      return {
        canSend: false,
        reason: 'Marketplace safety policy: 3rd-party platform messages strictly require human review and approval before sending.',
      };
    }

    const settings = await this.getSettings();

    // Final delivery strictly requires human approval
    if (messageType === 'final_delivery' && settings.finalDeliveryAlwaysRequiresApproval) {
      return {
        canSend: false,
        reason: 'Governance policy: Final delivery packages always require human operator sign-off.',
      };
    }

    // Check configured dispatch policy
    const policy = settings.dispatchPolicy[messageType];
    if (policy === 'auto_send') {
      return {
        canSend: true,
        reason: 'Direct client communication authorized for automatic dispatch in Autonomy Settings.',
      };
    }

    return {
      canSend: false,
      reason: `Message type "${messageType}" is configured as "Draft for Approval" in Autonomy Settings.`,
    };
  }

  /**
   * Validates whether a self-repair action can execute autonomously without human intervention.
   */
  static async canExecuteAutonomousRepair(params: {
    currentJobSpend: number;
    repairCost: number;
    jobSpendCeiling: number;
    hasNewRightsConcern: boolean;
    hasFactualClaimConcern: boolean;
  }): Promise<{ allowed: boolean; reason: string }> {
    const settings = await this.getSettings();

    if (params.hasNewRightsConcern) {
      return {
        allowed: false,
        reason: 'Mandatory Pause: Self-repair detected a potential likeness, voice, or IP ownership issue requiring human legal sign-off.',
      };
    }

    if (params.hasFactualClaimConcern) {
      return {
        allowed: false,
        reason: 'Mandatory Pause: Self-repair affects regulated product claims or packaging disclaimers requiring human verification.',
      };
    }

    if (params.repairCost > settings.maxAutoSpendPerRepair) {
      return {
        allowed: false,
        reason: `Repair cost ($${params.repairCost.toFixed(2)}) exceeds maximum automatic repair spend limit ($${settings.maxAutoSpendPerRepair.toFixed(2)}).`,
      };
    }

    const projectedSpend = params.currentJobSpend + params.repairCost;
    if (projectedSpend > params.jobSpendCeiling) {
      return {
        allowed: false,
        reason: `Projected spend ($${projectedSpend.toFixed(2)}) exceeds pre-approved job spend ceiling ($${params.jobSpendCeiling.toFixed(2)}). Operator budget increase required.`,
      };
    }

    if (projectedSpend > settings.maxAutoSpendPerJob) {
      return {
        allowed: false,
        reason: `Projected spend ($${projectedSpend.toFixed(2)}) exceeds studio maximum autonomous job ceiling ($${settings.maxAutoSpendPerJob.toFixed(2)}).`,
      };
    }

    return {
      allowed: true,
      reason: 'Repair is within pre-approved spend limits and does not violate rights or factual constraints.',
    };
  }

  /**
   * Checks whether any mandatory pause conditions exist for a job.
   */
  static async checkMandatoryPauses(
    job: Job,
    context?: {
      hasLikenessOrVoiceIssue?: boolean;
      hasUnclearOwnership?: boolean;
      hasFactualClaimIssue?: boolean;
      hasRegulatedPackagingIssue?: boolean;
      expectedMarginPct?: number;
      deadlineRiskPct?: number;
      clientDispute?: boolean;
    }
  ): Promise<{ shouldPause: boolean; triggers: string[] }> {
    const settings = await this.getSettings();
    const triggers: string[] = [];

    if (settings.mandatoryPauseConditions.likenessOrVoice && context?.hasLikenessOrVoiceIssue) {
      triggers.push('Human likeness or synthetic voice consent required.');
    }
    if (settings.mandatoryPauseConditions.unclearAssetOwnership && context?.hasUnclearOwnership) {
      triggers.push('Unclear asset ownership or trademark ambiguity.');
    }
    if (settings.mandatoryPauseConditions.factualAdvertisingClaims && context?.hasFactualClaimIssue) {
      triggers.push('Factual advertising claim or medical/health statement detected.');
    }
    if (settings.mandatoryPauseConditions.exactPackagingRegulatedCopy && context?.hasRegulatedPackagingIssue) {
      triggers.push('Exact packaging typography or regulatory text compliance required.');
    }
    if (settings.mandatoryPauseConditions.negativeExpectedMargin && (context?.expectedMarginPct ?? 100) < 30) {
      triggers.push(`Expected gross margin (${context?.expectedMarginPct}%) fell below viable threshold.`);
    }
    if (settings.mandatoryPauseConditions.missedDeadlineRisk && (context?.deadlineRiskPct ?? 0) > 75) {
      triggers.push('Deadline risk: over 75% of timeline elapsed without locked final cut.');
    }
    if (settings.mandatoryPauseConditions.clientDispute && context?.clientDispute) {
      triggers.push('Active client scope or quality dispute.');
    }

    return {
      shouldPause: triggers.length > 0,
      triggers,
    };
  }
}
