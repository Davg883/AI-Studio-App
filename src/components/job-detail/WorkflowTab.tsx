'use client';

import React, { useState } from 'react';
import { Workflow, WorkflowStep, Job, Generation, ProductionRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  isConceptStep,
  blockingConceptStep,
  conceptGateMessage,
  pendingConceptSelection,
  MAX_CONCEPT_SELECTIONS,
} from '@/lib/concept-gate';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CapabilityCatalogModal } from '../workflow/CapabilityCatalogModal';
import {
  CAPABILITY_CATALOG,
  ModelCapabilityItem,
  getCatalogModelById,
} from '@/lib/models/capability-catalog';
import {
  Layers,
  Play,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Ban,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shuffle,
  Coins,
  Settings2,
  BookOpen,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useOperatorName } from '@/lib/operator';

interface WorkflowTabProps {
  job: Job;
  workflow?: Workflow | null;
  generations?: Generation[];
  onRefresh: () => void;
  onBuildWorkflow: () => void;
  buildingWorkflow: boolean;
}

const ROLE_STYLES: Record<
  ProductionRole,
  { label: string; badgeClass: string; borderClass: string; bgClass: string; icon: string }
> = {
  SEARCH: {
    label: 'SEARCH: Exploration',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    borderClass: 'border-emerald-800/40',
    bgClass: 'bg-emerald-950/10',
    icon: '🔍',
  },
  CONTROL: {
    label: 'CONTROL: Preservation',
    badgeClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80',
    borderClass: 'border-indigo-800/40',
    bgClass: 'bg-indigo-950/10',
    icon: '🎯',
  },
  SHIP: {
    label: 'SHIP: Client Asset',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    borderClass: 'border-amber-800/40',
    bgClass: 'bg-amber-950/10',
    icon: '🚀',
  },
  FINISH: {
    label: 'FINISH: Upscale & Master',
    badgeClass: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800/80',
    borderClass: 'border-fuchsia-800/40',
    bgClass: 'bg-fuchsia-950/10',
    icon: '✨',
  },
};

export function WorkflowTab({
  job,
  workflow,
  generations = [],
  onRefresh,
  onBuildWorkflow,
  buildingWorkflow,
}: WorkflowTabProps) {
  const [operatorName] = useOperatorName();
  const [conceptPicks, setConceptPicks] = useState<string[]>([]);
  const [savingConcepts, setSavingConcepts] = useState(false);
  const [runningStepId, setRunningStepId] = useState<string | null>(null);
  const [cancelingStepId, setCancelingStepId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Manual Override state
  const [overrideStepId, setOverrideStepId] = useState<string | null>(null);
  const [selectedOverrideModelId, setSelectedOverrideModelId] = useState<string>('');
  const [overrideAttempts, setOverrideAttempts] = useState<number>(2);
  const [isOverriding, setIsOverriding] = useState(false);

  // Capability Catalog Modal
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Spend Approval Form state
  const [authorizingApproval, setAuthorizingApproval] = useState(false);
  const [customSpendCeiling, setCustomSpendCeiling] = useState<number>(
    job.maxApprovedBudget || Math.ceil((workflow?.totalEstimatedCost || 30) * 1.25)
  );

  if (!workflow) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-950/40">
        <Layers className="mx-auto h-9 w-9 text-cyan-400 mb-3" />
        <h3 className="text-base font-semibold text-zinc-100">
          No Production Route Proposed Yet
        </h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
          The Transparent Model Router evaluates the brief, reference assets, and target margins to construct an ordered, multi-model production plan across{' '}
          <span className="text-emerald-400 font-bold">SEARCH</span>,{' '}
          <span className="text-indigo-400 font-bold">CONTROL</span>,{' '}
          <span className="text-amber-400 font-bold">SHIP</span>, and{' '}
          <span className="text-fuchsia-400 font-bold">FINISH</span> roles.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="primary" onClick={onBuildWorkflow} loading={buildingWorkflow}>
            <Sparkles className="h-4 w-4 mr-2" />
            Propose Transparent Route
          </Button>
          <Button variant="outline" onClick={() => setIsCatalogOpen(true)}>
            <BookOpen className="h-4 w-4 mr-2 text-zinc-400" />
            Browse Capability Catalog ({CAPABILITY_CATALOG.length} Models)
          </Button>
        </div>

        <CapabilityCatalogModal
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
        />
      </div>
    );
  }

  const isApproved = job.approvalCheckpoints.workflowApproved;
  const spendCeiling = job.maxApprovedBudget || workflow.maxApprovedSpend || workflow.totalEstimatedCost;
  const isBudgetLocked = !!job.approvalCheckpoints.maxBudgetApproved;

  // Run Step Handler
  const handleRunStep = async (stepId: string) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setRunningStepId(stepId);
      const res = await fetch(`/api/jobs/${job.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', stepId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setSuccessMessage(`Generation successfully initiated for step.`);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation execution refused');
    } finally {
      setRunningStepId(null);
    }
  };

  // Retry Step Handler
  const handleRetryStep = async (stepId: string) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setRunningStepId(stepId);
      const res = await fetch(`/api/jobs/${job.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', stepId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Retry generation failed');
      }

      setSuccessMessage(`New generation attempt initiated.`);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Retry refused');
    } finally {
      setRunningStepId(null);
    }
  };

  // Cancel Step Handler
  const handleCancelStep = async (stepId: string) => {
    try {
      setErrorMessage(null);
      setCancelingStepId(stepId);
      const res = await fetch(`/api/jobs/${job.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', stepId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cancellation failed');
      }

      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Cancellation failed');
    } finally {
      setCancelingStepId(null);
    }
  };

  // Concept checkpoint: record which concepts carry forward
  const handleConfirmConcepts = async (stepId: string) => {
    try {
      setErrorMessage(null);
      setSavingConcepts(true);
      const res = await fetch(`/api/jobs/${job.id}/concept-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, generationIds: conceptPicks, operatorName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not record concept selection');
      }
      setSuccessMessage(
        `${conceptPicks.length} concept${conceptPicks.length === 1 ? '' : 's'} carried forward. Later steps can now run.`
      );
      setConceptPicks([]);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not record concept selection');
    } finally {
      setSavingConcepts(false);
    }
  };

  const toggleConceptPick = (generationId: string) => {
    setConceptPicks(prev =>
      prev.includes(generationId)
        ? prev.filter(id => id !== generationId)
        : prev.length >= MAX_CONCEPT_SELECTIONS
        ? prev
        : [...prev, generationId]
    );
  };

  // Run All Handler
  const handleRunAll = async () => {
    try {
      setErrorMessage(null);
      setRunningAll(true);
      const res = await fetch(`/api/jobs/${job.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', runAll: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.haltedForConceptSelection) {
        setSuccessMessage(`Paused at the concept checkpoint. ${data.haltedForConceptSelection.message}`);
      }
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation execution refused');
    } finally {
      setRunningAll(false);
    }
  };

  // Manual Model Override Handler
  const handleApplyOverride = async (stepId: string) => {
    if (!selectedOverrideModelId) return;
    try {
      setIsOverriding(true);
      setErrorMessage(null);
      const res = await fetch(`/api/jobs/${job.id}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          overrideModelId: selectedOverrideModelId,
          attempts: overrideAttempts,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to override model');
      }

      setSuccessMessage(data.message || 'Model override applied. Economics recalculated.');
      setOverrideStepId(null);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Override failed');
    } finally {
      setIsOverriding(false);
    }
  };

  // Workflow & Spend Limit Approval Handler
  const handleApproveWorkflowAndSpend = async () => {
    try {
      setAuthorizingApproval(true);
      setErrorMessage(null);
      const res = await fetch(`/api/jobs/${job.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_workflow_and_budget',
          maxApprovedBudget: customSpendCeiling,
          operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Workflow approval failed');
      }

      setSuccessMessage(
        `Route approved and authorized spend locked at $${customSpendCeiling}. Generations are now authorized inside this limit.`
      );
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval authorization failed');
    } finally {
      setAuthorizingApproval(false);
    }
  };

  const allCompleted = workflow.steps.every(s => s.status === 'Completed');
  const pendingSteps = workflow.steps.filter(s => s.status !== 'Completed');
  const conceptPending = pendingConceptSelection(workflow);

  return (
    <div className="space-y-6">
      {/* 1. Transparent Pipeline Progression Stepper */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
              Transparent Production Progression
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCatalogOpen(true)}
            className="text-xs font-mono h-7"
          >
            <BookOpen className="h-3 w-3 mr-1.5 text-zinc-400" />
            Capability Catalog ({CAPABILITY_CATALOG.length} Models)
          </Button>
        </div>

        {/* Visual Breadcrumb Steps */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 shrink-0">
            <span>1. SEARCH</span>
            <span className="text-zinc-400 text-xs">(8 Hooks)</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 shrink-0">
            <span>2. Human Selects 2</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 shrink-0">
            <span>3. CONTROL</span>
            <span className="text-zinc-400 text-xs">(Keyframes)</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 shrink-0">
            <span>4. SHIP</span>
            <span className="text-zinc-400 text-xs">(Final Motion)</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-900/60 text-indigo-200 shrink-0">
            <span>5. REPAIR</span>
            <span className="text-zinc-400 text-xs">(Inpaint Fix)</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-fuchsia-950/60 border border-fuchsia-800/80 text-fuchsia-300 shrink-0">
            <span>6. FINISH</span>
            <span className="text-zinc-400 text-xs">(4K & Audio)</span>
          </div>
          <ArrowRight className="h-3 w-3 text-zinc-500 shrink-0" />

          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
            <span>7. Final QA</span>
          </div>
        </div>
      </div>

      {/* 2. Top Human Approval & Budget Ceiling Authorization Gate */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Workflow Governance & Spend Authorization
              </h3>
              <Badge
                variant={isApproved ? 'success' : 'warning'}
                className="text-xs"
              >
                {isApproved ? 'Workflow & Spend Limit Authorized' : 'Pending Human Approval'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Studio Operator requires human operator sign-off before committing initial paid GPU generation. Runs are strictly constrained within the authorized spend ceiling.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-lg shrink-0">
            <div>
              <div className="text-zinc-400 text-xs uppercase">Route Estimate</div>
              <div className="text-cyan-300 font-bold text-sm">
                ${workflow.totalEstimatedCost.toFixed(2)}
              </div>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <div className="text-zinc-400 text-xs uppercase">Authorized Ceiling</div>
              <div className="text-amber-300 font-bold text-sm">
                ${spendCeiling.toFixed(2)}
              </div>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <div className="text-zinc-400 text-xs uppercase">Contract Budget</div>
              <div className="text-zinc-200 font-bold text-sm">
                {formatCurrency(job.budget)}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Form / Active Sign-off Banner */}
        {!isApproved ? (
          <div className="p-4 rounded-lg border border-amber-800/40 bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-amber-300 font-mono">
                  Human Sign-Off Required to Authorize Paid Runs
                </strong>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Confirm proposed model route and set the hard maximum spend limit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400">Ceiling ($):</span>
                <input
                  type="number"
                  min={Math.ceil(workflow.totalEstimatedCost)}
                  value={customSpendCeiling}
                  onChange={e => setCustomSpendCeiling(Number(e.target.value))}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-bold text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleApproveWorkflowAndSpend}
                loading={authorizingApproval}
                className="text-xs shrink-0 font-bold"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Authorize Route & Spend (${customSpendCeiling})
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">
                Authorized by <strong>{job.approvalCheckpoints.workflowApprovedBy || 'Operator'}</strong> • Hard spend ceiling locked at{' '}
                <strong className="text-emerald-200">${spendCeiling.toFixed(2)}</strong>.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {allCompleted ? (
                <Badge variant="success" className="text-xs">
                  ✓ All {workflow.steps.length} Steps Completed
                </Badge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAll}
                  loading={runningAll}
                  disabled={!!runningStepId || !!conceptPending}
                  title={
                    conceptPending
                      ? conceptGateMessage(conceptPending)
                      : 'Runs pending steps in order; pauses at the concept checkpoint for your choice'
                  }
                  className="text-xs"
                >
                  <Play className="h-3 w-3 mr-1.5 fill-current" />
                  {conceptPending ? 'Choose concepts to continue' : `Run All Approved Steps (${pendingSteps.length})`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Success / Error Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg border border-red-800/60 bg-red-950/30 text-xs text-red-200 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold text-red-300">Operator Guardrail Triggered:</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 4. Ordered Production Steps with Transparent Explanations */}
      <div className="space-y-4">
        {workflow.steps.map(step => {
          const role = step.role || 'SHIP';
          const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.SHIP;
          const isRunning = runningStepId === step.id;
          const isCanceling = cancelingStepId === step.id;
          const isExpanded = expandedStepId === step.id;
          const isOverridingThis = overrideStepId === step.id;
          const genRecord =
            generations.find(g => g.id === step.generationId) ||
            generations.find(g => g.stepId === step.id);
          const attemptsCount =
            (step.previousGenerationIds?.length || 0) + (genRecord ? 1 : 0);

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                step.status === 'Completed'
                  ? 'border-zinc-800/80 bg-zinc-950/60'
                  : step.status === 'Failed'
                  ? 'border-red-900/60 bg-red-950/20'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              {/* Main Card Header Bar */}
              <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Step Identification & Role */}
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 mt-0.5 ${
                      step.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : step.status === 'Failed'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {step.status === 'Completed' ? '✓' : step.order}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-zinc-100">{step.name}</h4>
                      <Badge className={`text-xs border ${roleStyle.badgeClass}`}>
                        {roleStyle.icon} {role}
                      </Badge>
                      <Badge variant="secondary" className="text-xs text-cyan-300">
                        {step.selectedModel}
                      </Badge>
                      {step.isOverridden && (
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-800">
                          Overridden by Operator
                        </Badge>
                      )}
                      {attemptsCount > 1 && (
                        <Badge variant="outline" className="text-xs text-amber-300 border-amber-800">
                          Attempt #{attemptsCount}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {step.purpose}
                    </p>
                  </div>
                </div>

                {/* Right: Step Cost & Controls */}
                <div className="flex items-center gap-3 self-end md:self-auto shrink-0 text-xs">
                  <div className="text-right">
                    <div className="text-zinc-200 font-bold">
                      ${(step.actualCost ?? step.estimatedTotalCost).toFixed(2)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {step.estimatedAttempts} attempts @ ${step.unitCost.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  {step.status === 'Completed' ? (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryStep(step.id)}
                        loading={isRunning}
                        disabled={!isApproved}
                        className="text-xs font-mono h-7 text-zinc-400 hover:text-zinc-200"
                        title="Re-roll generation step"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Re-roll
                      </Button>
                    </div>
                  ) : step.status === 'Failed' || step.status === 'Canceled' ? (
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={step.status === 'Canceled' ? 'warning' : 'destructive'}
                        className="text-xs"
                      >
                        {step.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRetryStep(step.id)}
                        loading={isRunning}
                        disabled={!isApproved}
                        className="text-xs font-mono h-7"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  ) : step.status === 'Queued' || step.status === 'Running' ? (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs animate-pulse">
                        {step.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelStep(step.id)}
                        loading={isCanceling}
                        className="text-xs font-mono h-7 text-red-400 hover:text-red-300 border-red-900/60 bg-red-950/20"
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRunStep(step.id)}
                        loading={isRunning}
                        disabled={!isApproved || runningAll || !!blockingConceptStep(workflow, step)}
                        title={
                          blockingConceptStep(workflow, step)
                            ? conceptGateMessage(blockingConceptStep(workflow, step)!)
                            : undefined
                        }
                        className="text-xs font-mono h-7"
                      >
                        <Play className="h-3 w-3 mr-1 fill-current" />
                        Run Step
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOverrideStepId(isOverridingThis ? null : step.id);
                          setSelectedOverrideModelId(step.selectedModelId || '');
                          setOverrideAttempts(step.estimatedAttempts);
                        }}
                        className="text-xs font-mono h-7 text-zinc-400 hover:text-zinc-200"
                        title="Override with alternative model"
                      >
                        <Shuffle className="h-3 w-3 mr-1" />
                        Override
                      </Button>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Concept checkpoint: operator chooses what carries forward */}
              {isConceptStep(step) && step.status === 'Completed' && (() => {
                const conceptOutputs = generations.filter(g => g.stepId === step.id && g.status === 'Completed');
                if (step.conceptSelection) {
                  return (
                    <div className="mx-4 mb-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-200">
                      <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-emerald-400" />
                      {step.conceptSelection.generationIds.length} concept
                      {step.conceptSelection.generationIds.length === 1 ? '' : 's'} carried forward by{' '}
                      {step.conceptSelection.selectedBy} · {formatDateTime(step.conceptSelection.selectedAt)}
                    </div>
                  );
                }
                return (
                  <div className="mx-4 mb-3 rounded-lg border border-amber-700/60 bg-amber-950/20 p-3 space-y-3">
                    <div className="text-xs text-amber-200">
                      <span className="font-semibold">Concept checkpoint.</span> Choose up to {MAX_CONCEPT_SELECTIONS}{' '}
                      concepts to carry forward. Later steps stay locked until you do.
                    </div>
                    {conceptOutputs.length === 0 ? (
                      <p className="text-xs text-zinc-400">No completed concept outputs yet. Re-roll this step to generate some.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Concept outputs">
                        {conceptOutputs.map((g, idx) => {
                          const picked = conceptPicks.includes(g.id);
                          const preview = g.thumbnailUrl || g.outputUrl;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => toggleConceptPick(g.id)}
                              aria-pressed={picked}
                              className={`rounded-md border p-1.5 text-left text-xs transition-colors ${
                                picked
                                  ? 'border-amber-400 bg-amber-950/40 text-amber-100'
                                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600'
                              }`}
                            >
                              {preview && g.outputType !== 'audio' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={preview} alt={`Concept ${idx + 1}`} className="aspect-video w-full rounded object-cover" />
                              ) : (
                                <div className="aspect-video w-full rounded bg-zinc-900" />
                              )}
                              <span className="mt-1 block">
                                {picked ? '✓ ' : ''}Concept {idx + 1}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleConfirmConcepts(step.id)}
                      loading={savingConcepts}
                      disabled={conceptPicks.length === 0}
                      className="text-xs"
                    >
                      Carry forward {conceptPicks.length}/{MAX_CONCEPT_SELECTIONS}
                    </Button>
                  </div>
                );
              })()}

              {/* Transparent Routing Analysis: Why It Fits, Failure Mode & Alternative */}
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Why It Fits */}
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <Info className="h-3.5 w-3.5" />
                    Why This Model Fits:
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {step.whyItFits || 'Chosen for capability adherence and optimal cost-to-quality profile.'}
                  </p>
                </div>

                {/* 2. Known Failure Mode */}
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Known Failure Mode:
                  </div>
                  <p className="text-amber-200/90 text-xs leading-relaxed">
                    {step.knownFailureMode || 'Edge blur during rapid camera turns.'}
                  </p>
                  {step.failureMitigation && (
                    <div className="text-xs text-zinc-400 pt-1 border-t border-amber-900/30">
                      <strong>Mitigation:</strong> {step.failureMitigation}
                    </div>
                  )}
                </div>

                {/* 3. Alternative Model */}
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-xs">
                      <Shuffle className="h-3.5 w-3.5" />
                      Alternative Model:
                    </div>
                    {step.alternativeModel ? (
                      <div>
                        <div className="text-zinc-200 text-xs font-bold mt-0.5">
                          {step.alternativeModel.name}
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed mt-0.5">
                          {step.alternativeModel.reason}
                        </p>
                        <div className="text-zinc-400 text-xs mt-1">
                          Tradeoff: {step.alternativeModel.tradeoff}
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-400 text-xs">
                        Catalog fallback available via override selector.
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setOverrideStepId(step.id);
                        if (step.alternativeModel) {
                          setSelectedOverrideModelId(step.alternativeModel.id);
                        }
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      Switch to Alternative →
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Model Override Drawer */}
              {isOverridingThis && (
                <div className="p-4 border-t border-cyan-800/40 bg-cyan-950/15 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-cyan-300 font-bold flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Manual Model Override for Step {step.order}
                    </strong>
                    <button
                      onClick={() => setOverrideStepId(null)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-400 block mb-1">
                        Select Target Model from Capability Catalog:
                      </label>
                      <select aria-label="Select Target Model from Capability Catalog:"
                        value={selectedOverrideModelId}
                        onChange={e => setSelectedOverrideModelId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">-- Choose Catalog Model --</option>
                        {(['SEARCH', 'CONTROL', 'SHIP', 'FINISH'] as ProductionRole[]).map(r => (
                          <optgroup key={r} label={`--- ROLE: ${r} ---`}>
                            {CAPABILITY_CATALOG.filter(m => m.role === r).map(m => (
                              <option key={m.id} value={m.id}>
                                [{r}] {m.name} (${m.unitCostUSD.toFixed(2)}/{m.costUnit})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">
                        Estimated Attempts:
                      </label>
                      <input aria-label="Estimated Attempts:"
                        type="number"
                        min="1"
                        max="10"
                        value={overrideAttempts}
                        onChange={e => setOverrideAttempts(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {selectedOverrideModelId && (
                    <div className="p-3 rounded bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                      {(() => {
                        const m = getCatalogModelById(selectedOverrideModelId);
                        if (!m) return null;
                        const newCost = Number((overrideAttempts * m.unitCostUSD).toFixed(2));
                        return (
                          <>
                            <div className="flex items-center justify-between text-cyan-300 font-bold">
                              <span>Selected: {m.name}</span>
                              <span>Estimated: ${newCost} ({overrideAttempts} × ${m.unitCostUSD})</span>
                            </div>
                            <p className="text-zinc-400">{m.bestUsedFor}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOverrideStepId(null)}
                      className="text-xs font-mono"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApplyOverride(step.id)}
                      loading={isOverriding}
                      disabled={!selectedOverrideModelId}
                      className="text-xs font-mono"
                    >
                      Apply Override & Recalculate Economics
                    </Button>
                  </div>
                </div>
              )}

              {/* Collapsible Model Prompt & Execution Details */}
              {isExpanded && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-xs space-y-3">
                  <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Model Inputs & Technical Prompt Specs:
                  </div>
                  <pre className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(step.inputs, null, 2)}
                  </pre>
                  <div className="text-xs text-zinc-400">
                    <strong className="text-zinc-300">Expected Outputs:</strong> {step.expectedOutputs}
                  </div>
                  {genRecord && (
                    <div className="space-y-1 text-xs border-t border-zinc-800/60 pt-3">
                      <div className="text-emerald-400">
                        <strong>Generation Request ID:</strong> {genRecord.providerRequestId}
                      </div>
                      <div className="text-zinc-400">
                        <strong>Reconciled GPU Spend:</strong> ${genRecord.actualCost ?? 0} (Pre-gen estimate: ${genRecord.costEstimate})
                      </div>
                      {genRecord.error && (
                        <div className="text-red-400">
                          <strong>Provider Error:</strong> {genRecord.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Capability Catalog Modal */}
      <CapabilityCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectModel={model => {
          if (overrideStepId) {
            setSelectedOverrideModelId(model.id);
          }
        }}
      />
    </div>
  );
}
