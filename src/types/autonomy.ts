/**
 * Studio Operator: Autonomy & Client Agent Types
 */

import { ProductionRole } from './index';

// -------------------------------------------------------------
// 1. Autonomy Settings & Policy Engine
// -------------------------------------------------------------
export type MessageDispatchPolicy = 'auto_send' | 'draft_for_approval';

export type MessageType =
  | 'intake_question'
  | 'asset_request'
  | 'scope_proposal'
  | 'milestone_update'
  | 'concept_presentation'
  | 'revision_interpretation'
  | 'change_order'
  | 'final_delivery'
  | 'retention_followup';

export interface AutonomySettings {
  maxAutoSpendPerJob: number;          // e.g. $50.00
  maxAutoSpendPerRepair: number;       // e.g. $15.00
  maxGenerationAttemptsPerStep: number;// e.g. 3
  totalAccountSpendLimitUSD: number;   // e.g. $1000.00
  allowedModelFamilies: string[];      // e.g. ['Seedream', 'Seedance', 'Soul', 'Qwen', 'Wan', 'Topaz', 'ElevenLabs']
  autoShareConcepts: boolean;          // Default false
  finalDeliveryAlwaysRequiresApproval: true; // Server-enforced invariant: strictly cannot be toggled false
  dispatchPolicy: Record<MessageType, MessageDispatchPolicy>;
  mandatoryPauseConditions: {
    likenessOrVoice: boolean;          // Real/synthetic person likeness or voice consent
    unclearAssetOwnership: boolean;    // Ambiguous IP or copyright
    factualAdvertisingClaims: boolean; // Health, medical, financial claims
    exactPackagingRegulatedCopy: boolean; // Exact ingredients, labels, warnings
    negativeExpectedMargin: boolean;   // Target margin violated
    missedDeadlineRisk: boolean;       // >75% time elapsed without final cut
    clientDispute: boolean;            // Scope or quality contention
  };
  notificationEmail?: string;
  updatedAt: string;
  updatedBy: string;
}

// -------------------------------------------------------------
// 1b. Atomic Budget Reservation
// -------------------------------------------------------------
export interface SpendReservation {
  id: string;
  jobId: string;
  amountUSD: number;
  purpose: string;
  status: 'reserved' | 'committed' | 'released';
  createdAt: string;
  expiresAt: string;
  stepId?: string;
}

export interface AtomicSpendResult {
  success: boolean;
  reservationId?: string;
  currentSpendUSD: number;
  reservedSpendUSD: number;
  remainingBudgetUSD: number;
  error?: string;
}

// -------------------------------------------------------------
// 1c. Verified Operations & Deliverables
// -------------------------------------------------------------
export type VerifiedModelOperation =
  | 'text-to-video'
  | 'image-to-video'
  | 'text-to-image'
  | 'inpaint'
  | 'upscale'
  | 'voiceover';

export interface VerifiedOperationSpec {
  provider: 'Higgsfield' | 'ByteDance' | 'Partner';
  accessRoute: 'Official SDK' | 'REST' | 'SDK & REST';
  exactModelId: string;
  operation: VerifiedModelOperation;
  supportedInputs: string[];
  quotePerUnitUSD: number;
  quoteUnit: string;
  quoteLabel: 'Verified Catalog Quote' | 'Example Quote (Pending Live Benchmark)';
}

export type VerifiedDeliverableFormat =
  | '1080p_mp4'
  | '1080x1920_mp4'
  | '1920x1080_png'
  | '1080x1080_png';

export interface VerifiedDeliverable {
  name: string;
  format: VerifiedDeliverableFormat;
  technicalSpecs: string; // e.g. "1920x1080 H.264 / AAC 48kHz, 24fps, Rec.709"
  verified: boolean;
  fileSizeBytes?: number;
  url?: string;
  verifiedAt?: string;
}

// -------------------------------------------------------------
// 2. Account-Level Client Memory
// -------------------------------------------------------------
export interface ClientMemory {
  clientId: string;
  clientName: string;
  brandName: string;
  accountType: 'direct_client' | 'first_party_portal' | 'marketplace_client';
  approvedAssets: {
    logos: Array<{ name: string; url: string; format: string; isPrimary: boolean }>;
    brandColors: Array<{ name: string; hex: string; role: 'primary' | 'secondary' | 'accent' }>;
    fonts: Array<{ name: string; category: 'headline' | 'body' | 'accent' }>;
    guidelineDocuments: Array<{ name: string; url: string }>;
  };
  productDetails: Array<{
    name: string;
    description: string;
    keyIngredientsOrFeatures: string[];
    packagingSpecs: string;
    forbiddenClaims: string[];
  }>;
  toneOfVoice: {
    personality: string[];
    bannedWords: string[];
    samplePhrases: string[];
  };
  creativeHistory: {
    winningStyles: string[];
    rejectedStyles: string[];
    preferredPacing: string;
  };
  deliveryPreferences: {
    primaryFormat: string;
    aspectRatios: string[];
    cloudFolderUrl?: string;
  };
  communicationPreferences: {
    updateFrequency: 'milestones_only' | 'daily' | 'detailed';
    timezone: string;
    clientContactPerson: string;
    clientEmail: string;
  };
  // Hard Privacy & Rights Invariant
  consentFirewall: {
    hasStoredLikenessConsent: boolean;
    authorizedPersons: string[];
    consentScopeNotice: string; // "Never treat an earlier approval as consent for a new person's likeness, voice, or a materially different use."
  };
  updatedAt: string;
}

// -------------------------------------------------------------
// 3. Productized Service Templates
// -------------------------------------------------------------
export type ProductizedTemplateId = 'launch_video' | 'ugc_ad_pack' | 'localization_pack';

export interface ProductizedServiceTemplate {
  id: ProductizedTemplateId;
  name: string;
  tagline: string;
  description: string;
  turnaroundHours: number;
  fixedPriceUSD: number;
  maxProductionSpendUSD: number;
  targetGrossMarginPct: number;
  deliverablesSummary: string[];
  requiredInputs: string[];
  acceptedFileTypes: string[];
  modelRecipe: Array<{
    role: ProductionRole;
    modelId: string;
    purpose: string;
    plannedAttempts: number;
  }>;
  qualityChecklist: string[];
  includedRevisions: number;
  escalationConditions: string[];
}

// -------------------------------------------------------------
// 4. Client Agent Messaging & Scope (3-Phase Lifecycle)
// -------------------------------------------------------------
export type MessageLifecycleStatus = 'drafted' | 'operator_authorised' | 'dispatched' | 'received';

export interface ClientMessage {
  id: string;
  jobId: string;
  type: MessageType;
  direction: 'outbound' | 'inbound';
  subject: string;
  body: string;
  status: MessageLifecycleStatus;
  channel: 'email' | 'first_party_portal' | 'upwork_safe_draft' | 'contra_safe_draft' | 'fiverr_safe_draft';
  isMarketplaceSafeDraft: boolean;
  requiresHumanApproval: boolean;
  // Content Sealing & Authorisation Audit
  contentHash?: string;       // SHA-256 of subject + body
  authorizedBy?: string;
  authorizedAt?: string;
  dispatchedAt?: string;
  createdAt: string;
  meta?: Record<string, any>;
}

export interface ScopeProposal {
  id: string;
  jobId: string;
  deliverables: Array<{ name: string; specs: string; format: string }>;
  timeline: string;
  priceUSD: number;
  includedRevisions: string;
  exclusions: string[];
  plainEnglishSummary: string;
  status: 'draft' | 'presented' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  jobId: string;
  requestedChangeDescription: string;
  affectedAsset: string;
  affectedProductionStep: string;
  isScopeChange: boolean;             // True if beyond included revision rounds
  reasoning: string;
  incrementalCostUSD: number;
  additionalDays: number;
  status: 'draft' | 'presented' | 'approved_by_client' | 'declined';
  createdAt: string;
}

// -------------------------------------------------------------
// 5. QA-Assisted Defect Diagnostics & Repair
// -------------------------------------------------------------
export type DefectType =
  | 'geometry_reflection_failure'
  | 'packaging_label_drift'
  | 'temporal_flicker'
  | 'micro_anatomy_distortion'
  | 'lighting_mismatch'
  | 'audio_pronunciation_defect';

export interface QACheckResult {
  stepId: string;
  generationId: string;
  passed: boolean;
  confidenceScore: number;            // 0 - 100
  defectsDetected: Array<{
    type: DefectType;
    severity: 'minor' | 'moderate' | 'critical';
    component: string;                // Smallest failed component e.g. "Bottle base shadow and ground reflection"
    description: string;
    referenceDiscrepancy: string;
  }>;
}

export interface QARepairRecommendation {
  id: string;
  stepId: string;
  generationId: string;
  defectComponent: string;
  defectType: DefectType;
  recommendedAction: 'targeted_edit' | 'regenerate_shot' | 'change_model' | 'ask_client' | 'escalate_to_operator';
  exactModelId: string;
  operation: string;
  quotedCostUSD: number;
  costLabel: 'Verified Catalog Quote' | 'Example Quote (Pending Live Benchmark)';
  reasoning: string;
  technicalPrerequisites: string[]; // e.g. ["Extract keyframe at 00:03:12", "Generate inpainting mask"]
  status: 'recommended' | 'operator_approved' | 'rejected' | 'completed';
}

export interface RepairRun {
  id: string;
  jobId: string;
  stepId: string;
  generationId: string;
  qaResult: QACheckResult;
  recommendation?: QARepairRecommendation;
  selectedAction: 'targeted_edit' | 'regenerate_shot' | 'change_model' | 'ask_client' | 'escalate_to_operator';
  targetModel: string;
  actionDetails: string;
  estimatedCostUSD: number;
  remainingProductionBudgetUSD: number;
  executedAutonomously: boolean;
  operatorApproved: boolean;
  escalatedToOperator: boolean;
  escalationReason?: string;
  status: 'pending' | 'repairing' | 'repaired' | 'failed' | 'escalated';
  repairedAssetUrl?: string;
  createdAt: string;
  completedAt?: string;
}

// -------------------------------------------------------------
// 6. Autonomy Audit Log
// -------------------------------------------------------------
export type AuditEventType =
  | 'model_decision'
  | 'message_draft'
  | 'message_authorised'
  | 'message_dispatched'
  | 'human_approval'
  | 'generation_started'
  | 'generation_completed'
  | 'self_repair_recommended'
  | 'self_repair_completed'
  | 'cost_reserved'
  | 'cost_committed'
  | 'cost_released'
  | 'scope_change_order'
  | 'pause_escalation'
  | 'delivery_signed_off';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  jobId: string;
  jobTitle?: string;
  eventType: AuditEventType;
  actor: 'agent' | 'human_operator' | 'client';
  actorName: string;
  summary: string;
  details: string;
  spendDeltaUSD?: number;
  cumulativeSpendUSD?: number;
  riskFlag?: string;
  meta?: Record<string, any>;
}
