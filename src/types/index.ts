export type JobSource = 'Upwork' | 'Fiverr' | 'Contra' | 'Email' | 'Direct Lead';

export type JobStatus =
  | 'New'
  | 'Needs Review'
  | 'Approved'
  | 'Generating'
  | 'QA'
  | 'Delivered'
  | 'Rejected';

export interface ReferenceAsset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf' | 'link';
  notes?: string;
}

export interface HumanApprovalCheckpoints {
  workflowApproved: boolean;
  workflowApprovedAt?: string;
  workflowApprovedBy?: string;
  maxBudgetApproved: boolean;
  maxBudgetAmount?: number;
  rightsCleared: boolean;
  rightsApprovedAt?: string;
  rightsApprovedBy?: string;
  finalDeliveryApproved: boolean;
  finalDeliveryApprovedAt?: string;
  finalDeliveryApprovedBy?: string;
}

export interface Job {
  id: string;
  title: string;
  clientName: string;
  source: JobSource;
  rawBrief: string;
  budget: number; // Client offered budget in USD
  deadline: string; // ISO string
  status: JobStatus;
  clientNotes?: string;
  referenceAssets: ReferenceAsset[];
  channelFeePct: number; // e.g. 10% for Upwork, 0% for Direct
  contingencyPct: number; // default 15%
  maxApprovedBudget?: number;
  approvalCheckpoints: HumanApprovalCheckpoints;
  createdAt: string;
  updatedAt: string;
  originalAnalysis?: StructuredBriefAnalysis | null;
  editedAnalysis?: StructuredBriefAnalysis | null;
  humanReviewApproved?: boolean;
  humanReviewApprovedAt?: string;
  humanReviewNotes?: string;
  // Unified 6-Stage Supervised Workflow Telemetry
  activeStage?: 'brief' | 'plan' | 'authorise' | 'produce' | 'review' | 'deliver';
  nextAction?: string;
  activeBlocker?: string;
  reservedSpend?: number;
  laborHoursEstimated?: number;
  laborHoursActual?: number;
  laborRatePerHourUSD?: number;
  verifiedDeliverables?: import('./autonomy').VerifiedDeliverable[];
  /** Seeded / demonstration scenario, not a commissioned job; approvals on it are not real */
  isDemo?: boolean;
  // Computed by the jobs list API (not persisted): brief analysis has an unresolved high-severity rights concern
  hasOpenRightsIssue?: boolean;
  // Computed by the jobs list API (not persisted): every workflow step is completed or skipped
  productionComplete?: boolean;
  // Computed by the jobs list API (not persisted): a production workflow exists
  workflowBuilt?: boolean;
  // Computed by the jobs list API (not persisted): a concept step is waiting for the operator's choice
  conceptSelectionPending?: boolean;
}

export interface StructuredDeliverable {
  id?: string;
  name: string;
  type: string;
  format: string;
  aspectRatio: string;
  durationSeconds?: number;
  targetDurationSeconds?: number;
  resolution: string;
  exactTextRequirements?: string[];
  description?: string;
}

export interface RightsAndConsentFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  requiresApproval?: boolean;
  approved?: boolean;
}

export interface ProposedWorkflowStep {
  stepName: string;
  capabilityNeeded: string;
  purpose: string;
}

export type AnalysisDecision = 'accept' | 'human_review' | 'reject';

export interface StructuredBriefAnalysis {
  id: string;
  jobId: string;
  jobType: string;
  conciseSummary: string;
  deliverables: StructuredDeliverable[];
  suppliedAssets: string[];
  missingAssets: string[];
  questionsForClient: string[];
  brandConstraints: string[];
  rightsAndConsentFlags: RightsAndConsentFlag[];
  technicalRisks: string[];
  revisionRisk: 'low' | 'medium' | 'high';
  confidence: number; // 0 to 100
  decision: AnalysisDecision;
  decisionReasons: string[];
  proposedWorkflow: ProposedWorkflowStep[];
  estimatedAttemptsByStep: Record<string, number>;
  assumptions: string[];

  // Deterministic engine post-calculation
  deterministicDecision?: AnalysisDecision;
  deterministicReasons?: string[];
  calculatedProductionCost?: number;
  calculatedGrossMargin?: number;
  calculatedMarginPct?: number;

  // Metadata & Auditing
  modelUsed: string; // e.g. "gpt-6-astra (OpenAI Responses API)"
  analyzedAt: string;
  isHumanEdited?: boolean;
  editedAt?: string;
  editedBy?: string;

  // Backward compatibility helpers for UI components
  dimensions?: string[];
  durations?: string[];
  references?: string[];
  exactText?: string[];
  missingInformation?: string[];
  rightsConcerns?: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    issue: string;
    mitigation: string;
    requiresApproval: boolean;
    approved?: boolean;
  }>;
  rationale?: string;
}

// Backward-compatible alias
export type BriefAnalysis = StructuredBriefAnalysis;

export type WorkflowApprovalStatus =
  | 'Draft'
  | 'Pending Human Approval'
  | 'Approved'
  | 'Rejected'
  | 'Revision Requested';

export type WorkflowStepStage =
  | 'Concept & Keyframe'
  | 'Cinematic Video Gen'
  | 'Camera Motion / DoP'
  | 'Voice & Audio'
  | 'Finishing & Upscaling';

export type ProductionRole = 'SEARCH' | 'CONTROL' | 'SHIP' | 'FINISH';

export interface ModelAlternative {
  id: string;
  name: string;
  unitCost: number;
  reason: string;
  tradeoff: string;
}

export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  stage: WorkflowStepStage;
  selectedModel: string;
  selectedModelId?: string;
  role?: ProductionRole;
  whyItFits?: string;
  knownFailureMode?: string;
  failureMitigation?: string;
  alternativeModel?: ModelAlternative;
  availableAlternatives?: ModelAlternative[];
  maxAuthorizedSpend?: number;
  isOverridden?: boolean;
  originalModel?: string;
  queueEstimateSeconds?: number;
  capabilityNeeded?: string;
  purpose: string;
  inputs: {
    prompt?: string;
    referenceImage?: string;
    motionSpeed?: string;
    cameraMovement?: string;
    voiceId?: string;
    aspectRatio?: string;
    resolution?: string;
    [key: string]: any;
  };
  expectedOutputs: string;
  estimatedAttempts: number;
  unitCost: number;
  estimatedTotalCost: number;
  actualCost?: number;
  status: 'Pending Approval' | 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Canceled' | 'Skipped';
  generationId?: string;
  previousGenerationIds?: string[];
  /** Concept checkpoint: later steps wait until the operator chooses what carries forward */
  requiresConceptSelection?: boolean;
  conceptSelection?: {
    generationIds: string[];
    selectedBy: string;
    selectedAt: string;
    notes?: string;
  };
}

export interface Workflow {
  id: string;
  jobId: string;
  steps: WorkflowStep[];
  totalEstimatedCost: number;
  approvalStatus: WorkflowApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  maxApprovedSpend?: number;
}

export type GenerationStatus = 'Queued' | 'Processing' | 'Completed' | 'Failed' | 'Canceled';

export interface Generation {
  id: string;
  jobId: string;
  stepId: string;
  providerRequestId: string;
  model: string;
  status: GenerationStatus;
  costEstimate: number;
  actualCost?: number;
  outputUrl?: string;
  thumbnailUrl?: string;
  outputType: 'image' | 'video' | 'audio' | 'render';
  aspectRatio?: string;
  durationSeconds?: number;
  meta?: Record<string, any>;
  error?: string;
  appTimeout?: boolean;
  providerStatus?: string;
  retryCount?: number;
  retryOfGenerationId?: string;
  cancelUrl?: string;
  statusUrl?: string;
  localAssetPath?: string;
  normalizedAsset?: any;
  startedAt: string;
  completedAt?: string;
}

export interface Revision {
  id: string;
  jobId: string;
  clientNote: string;
  affectedDeliverable: string;
  recommendedAction: string;
  expectedIncrementalCost: number;
  approvalStatus: 'Pending Human Approval' | 'Approved' | 'Declined';
  approvedAt?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ProfitabilityMetrics {
  clientBudget: number;
  estimatedGenSpend: number;
  actualGenSpend: number;
  contingencyPct: number;
  contingencyAmount: number;
  channelFeePct: number;
  channelFeeAmount: number;
  totalEstimatedCost: number;
  expectedGrossMargin: number;
  expectedMarginPct: number;
  actualGrossMargin?: number;
  actualMarginPct?: number;
  budgetStatus: 'healthy' | 'warning' | 'deficit';
  // Explicit Studio Labor & Operational Economics
  laborCostEstimated?: number;
  laborCostActual?: number;
  finishingSpend?: number;
  revisionsSpend?: number;
  netProfitUSD?: number;
  netMarginPct?: number;
}

export * from './autonomy';

