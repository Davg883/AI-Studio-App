import { Job, BriefAnalysis, Workflow } from '@/types';

export type StageKey = 'brief' | 'plan' | 'authorise' | 'produce' | 'review' | 'deliver';
export type StageStatus = 'done' | 'current' | 'upcoming';

export type SectionKey = 'brief' | 'decision' | 'review' | 'workflow' | 'costs';

/** Where in the job page the next action is performed */
export interface ActionTarget {
  stage: StageKey;
  section?: SectionKey;
}

export const STAGE_ORDER: StageKey[] = ['brief', 'plan', 'authorise', 'produce', 'review', 'deliver'];

export interface JobState {
  analysed: boolean;
  planBuilt: boolean;
  budgetLocked: boolean;
  rightsCleared: boolean;
  generating: boolean;
  produced: boolean;
  delivered: boolean;
  rejected: boolean;
  currentStage: StageKey;
  stageStatus: Record<StageKey, StageStatus>;
  /** What should happen next, derived from checkpoints (never stale stored text). */
  nextAction: string;
  /** Gate currently preventing progress, or null when nothing is blocking. */
  blocker: string | null;
  /** Short label for pipeline cards; null when the operator has nothing to do. */
  waitingOn: string | null;
  /** Where the next action can be carried out; null when there is nothing to do */
  actionTarget: ActionTarget | null;
}

/**
 * Single source of truth for where a job is in the supervised pipeline.
 * Every panel (telemetry, stage bar, approval timeline, pipeline cards) should read from this
 * instead of re-deriving state from `status` or individual checkpoint flags.
 *
 * `analysis` / `workflow` are optional: list views only have the Job, so we fall back to
 * status and checkpoint flags when they are not supplied.
 */
export function getJobState(
  job: Job,
  opts: { analysis?: BriefAnalysis | null; workflow?: Workflow | null } = {}
): JobState {
  const cp = job.approvalCheckpoints;
  const status = job.status;
  const pastProduction = status === 'Generating' || status === 'QA' || status === 'Delivered';

  const delivered = status === 'Delivered' || cp.finalDeliveryApproved;
  const rejected = status === 'Rejected';
  const budgetLocked = cp.workflowApproved && cp.maxBudgetApproved;
  // Mirrors the generate route: rights only gate production when a high-severity concern is unresolved.
  const knownAnalysis = opts.analysis ?? job.editedAnalysis ?? job.originalAnalysis;
  const openHighRightsIssue = knownAnalysis
    ? !!knownAnalysis.rightsConcerns?.some(rc => rc.severity === 'high' && !rc.approved)
    : !!job.hasOpenRightsIssue;
  const rightsCleared = cp.rightsCleared || !openHighRightsIssue;
  const analysed =
    !!opts.analysis || !!job.originalAnalysis || !!job.editedAnalysis || status !== 'New' || budgetLocked;
  // `workflow: null` means "fetched, none exists"; omitted means the caller only has the Job (list views)
  const workflowExists = opts.workflow !== undefined ? !!opts.workflow : !!job.workflowBuilt;
  // A locked budget without a workflow (seen in seeded data) still has nothing to run, so it isn't "planned"
  const planBuilt = workflowExists || pastProduction;
  const generating = status === 'Generating';
  // Status can lag behind the workflow (e.g. every step completed but the job never moved to QA)
  const workflowComplete = opts.workflow
    ? opts.workflow.steps.length > 0 &&
      opts.workflow.steps.every(step => step.status === 'Completed' || step.status === 'Skipped')
    : !!job.productionComplete;
  const produced = delivered || status === 'QA' || workflowComplete;

  let currentStage: StageKey;
  let nextAction: string;
  let blocker: string | null = null;
  let waitingOn: string | null = null;
  let actionTarget: ActionTarget | null = null;

  if (rejected) {
    currentStage = 'brief';
    nextAction = 'Job rejected. No further action required.';
  } else if (delivered) {
    currentStage = 'deliver';
    nextAction = 'Delivered. Follow up with the client for feedback or a retainer.';
  } else if (!analysed) {
    currentStage = 'brief';
    nextAction = 'Run brief analysis';
    waitingOn = 'Needs analysis';
    actionTarget = { stage: 'brief', section: 'brief' };
  } else if (!planBuilt) {
    currentStage = 'plan';
    nextAction =
      status === 'Needs Review' ? 'Review the analysis, then build the production workflow' : 'Build the production workflow';
    waitingOn = status === 'Needs Review' ? 'Review analysis' : 'Needs workflow';
    actionTarget =
      status === 'Needs Review' ? { stage: 'brief', section: 'decision' } : { stage: 'plan', section: 'workflow' };
  } else if (!budgetLocked) {
    currentStage = 'authorise';
    nextAction = 'Approve the workflow and lock the budget ceiling';
    blocker = 'Budget ceiling not locked';
    waitingOn = 'Budget lock';
    actionTarget = { stage: 'authorise' };
  } else if (!rightsCleared) {
    currentStage = 'authorise';
    nextAction = 'Clear rights & IP flags';
    blocker = 'Rights clearance pending';
    waitingOn = 'Rights clearance';
    actionTarget = { stage: 'authorise' };
  } else if (!produced) {
    currentStage = 'produce';
    nextAction = generating
      ? 'Generation running inside the approved spend ceiling'
      : 'Start generation inside the approved spend ceiling';
    // Not a human checkpoint: the agent may run autonomously inside the locked ceiling
    waitingOn = null;
    actionTarget = generating ? { stage: 'produce' } : { stage: 'plan', section: 'workflow' };
  } else {
    currentStage = 'review';
    nextAction = 'QA the outputs and sign off final delivery';
    blocker = 'Final delivery sign-off required';
    waitingOn = 'Final sign-off';
    actionTarget = { stage: 'deliver' };
  }

  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageStatus = Object.fromEntries(
    STAGE_ORDER.map((key, idx) => [
      key,
      delivered || idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'upcoming',
    ])
  ) as Record<StageKey, StageStatus>;

  return {
    analysed,
    planBuilt,
    budgetLocked,
    rightsCleared,
    generating,
    produced,
    delivered,
    rejected,
    currentStage,
    stageStatus,
    nextAction,
    blocker,
    waitingOn,
    actionTarget,
  };
}

/** Days until the deadline (negative when overdue), or null if no valid deadline. */
export function daysUntil(deadline: string | undefined | null, now = new Date()): number | null {
  if (!deadline) return null;
  const due = new Date(deadline);
  if (isNaN(due.getTime())) return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);
}
