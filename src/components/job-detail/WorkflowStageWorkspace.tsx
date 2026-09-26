'use client';

import React, { useRef, useState } from 'react';
import {
  Job,
  BriefAnalysis,
  Workflow,
  Generation,
  Revision,
  ProfitabilityMetrics,
  ClientMessage,
  RepairRun,
} from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Shield,
  Layers,
  FileText,
  UserCheck,
  Send,
  Wrench,
  Sparkles,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getJobState, StageKey, ActionTarget, STAGE_ORDER } from '@/lib/job-state';
import { useOperatorName } from '@/lib/operator';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { useToast, responseError } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';

interface WorkflowStageWorkspaceProps {
  job: Job;
  analysis: BriefAnalysis | null;
  workflow: Workflow | null;
  generations: Generation[];
  revisions: Revision[];
  profitability: ProfitabilityMetrics | null;
  messages: ClientMessage[];
  repairRuns: RepairRun[];
  onRefresh: () => void;
  /** Controlled stage selection: the stage bar is the page's primary navigation */
  activeStage: StageKey;
  onStageChange: (stage: StageKey) => void;
  /** Optional count badges per stage (e.g. outputs, revisions) */
  stageBadges?: Partial<Record<StageKey, number>>;
  /** Navigate to where the next action is carried out */
  onNextAction?: (target: ActionTarget) => void;
  /** Page-provided content for the active stage, rendered above this component's own stage panel */
  children?: React.ReactNode;
}

const STAGES: { key: StageKey; label: string; number: number }[] = [
  { key: 'brief', label: '1. Brief', number: 1 },
  { key: 'plan', label: '2. Plan', number: 2 },
  { key: 'authorise', label: '3. Authorise', number: 3 },
  { key: 'produce', label: '4. Produce', number: 4 },
  { key: 'review', label: '5. Review', number: 5 },
  { key: 'deliver', label: '6. Deliver', number: 6 },
];

export function WorkflowStageWorkspace({
  job,
  analysis,
  workflow,
  generations,
  revisions,
  profitability,
  messages,
  repairRuns,
  onRefresh,
  activeStage,
  onStageChange,
  stageBadges,
  onNextAction,
  children,
}: WorkflowStageWorkspaceProps) {
  const toast = useToast();
  const [operatorName] = useOperatorName();
  const state = getJobState(job, { analysis, workflow });
  const [authorising, setAuthorising] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [deliverySignOffOpen, setDeliverySignOffOpen] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureToken, setSignatureToken] = useState('');
  const signOffRef = useRef<HTMLDivElement>(null);
  useFocusTrap(signOffRef, deliverySignOffOpen);
  const signatureMatches = typedSignature.trim().toLowerCase() === operatorName.trim().toLowerCase();

  const openSignOff = () => {
    setTypedSignature('');
    setVerifiedDeliverablesChecked(false);
    setDeliveryError('');
    setSignatureToken('OP-SIG-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    setDeliverySignOffOpen(true);
  };
  const [delivering, setDelivering] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [verifiedDeliverablesChecked, setVerifiedDeliverablesChecked] = useState(false);

  // Revision interpreter state
  const [revisionInput, setRevisionInput] = useState('');
  const [revisionInterpreting, setRevisionInterpreting] = useState(false);
  const [revisionOptions, setRevisionOptions] = useState<any[] | null>(null);

  // Financial figures: margin always comes from the server-side CostCalculator so every panel agrees
  const maxApprovedSpend = state.budgetLocked
    ? job.maxApprovedBudget ?? job.approvalCheckpoints.maxBudgetAmount ?? workflow?.maxApprovedSpend ?? null
    : null;
  // Spend counted against the provider cap (USD): billed plus simulated runs
  const actualGenSpend = (profitability?.actualGenSpendUSD ?? 0) + (profitability?.simulatedGenSpendUSD ?? 0);
  const reservedSpend = job.reservedSpend || 0;
  const remainingBudget =
    maxApprovedSpend != null ? Math.max(0, maxApprovedSpend - (actualGenSpend + reservedSpend)) : null;
  const contributionPct = profitability ? profitability.expectedContributionPct : null;
  const contributionComplete = profitability?.contributionComplete ?? false;
  const deliverableNames = (job.verifiedDeliverables || []).map(d => d.name);

  // Authorise message handler
  const handleAuthoriseMessage = async (messageId: string) => {
    try {
      setAuthorising(true);
      const res = await fetch(`/api/jobs/${job.id}/client-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authorise_message', messageId, operatorName }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Could not authorise message'));
      toast.success('Message authorised and sealed.');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not authorise message');
    } finally {
      setAuthorising(false);
    }
  };

  // Dispatch message handler
  const handleDispatchMessage = async (messageId: string) => {
    try {
      setDispatching(messageId);
      const res = await fetch(`/api/jobs/${job.id}/client-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch_message', messageId }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Dispatch failed'));
      toast.success('Message dispatched.');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Dispatch failed');
    } finally {
      setDispatching(null);
    }
  };

  // Revision interpreter handler
  const handleInterpretRevision = async () => {
    try {
      setRevisionInterpreting(true);
      const res = await fetch(`/api/jobs/${job.id}/client-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'interpret_revision',
          feedbackNote: revisionInput,
          currentRound: 1,
          maxIncluded: 2,
        }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Could not interpret feedback'));
      const data = await res.json();
      setRevisionOptions(data.interpretation?.interpretationOptions || []);
    } catch (e: any) {
      toast.error(e.message || 'Could not interpret feedback');
    } finally {
      setRevisionInterpreting(false);
    }
  };

  // Final delivery sign-off handler
  const handleFinalDeliverySignOff = async () => {
    try {
      setDelivering(true);
      setDeliveryError('');
      const res = await fetch(`/api/jobs/${job.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorSignOff: {
            operatorName,
            signatureToken,
            notes: deliverableNames.length
              ? `Verified and released: ${deliverableNames.join(', ')}.`
              : 'Verified deliverables released.',
          },
          verifiedFormatsConfirmed: verifiedDeliverablesChecked,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeliveryError(data.error || 'Delivery sign-off failed');
      } else {
        setDeliverySuccess(true);
        toast.success(`Final delivery signed off by ${operatorName}.`);
        setTimeout(() => {
          setDeliverySignOffOpen(false);
          setDeliverySuccess(false);
          onRefresh();
        }, 1500);
      }
    } catch (e: any) {
      setDeliveryError(e.message || 'Delivery sign-off failed');
    } finally {
      setDelivering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP TELEMETRY: Status, Next Action, Blocker, and Remaining Budget */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800 text-xs">
          {/* Status & Active Stage */}
          <div className="pr-2 space-y-1.5">
            <div className="text-zinc-400 uppercase text-xs tracking-wider">Production Stage</div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  state.generating ? 'bg-cyan-400 animate-pulse' : state.delivered ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="font-bold text-zinc-100 text-sm capitalize">
                Stage: {state.currentStage}
              </span>
            </div>
            <div className="text-xs text-zinc-400">Job Status: {job.status}</div>
          </div>

          {/* Next Action */}
          <div className="md:px-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-400 uppercase text-xs tracking-wider">Next Action</div>
            {state.actionTarget && onNextAction ? (
              <button
                onClick={() => onNextAction(state.actionTarget!)}
                className="group w-full text-left rounded-md border border-amber-700/60 bg-amber-950/30 px-2.5 py-1.5 font-semibold text-xs text-amber-200 hover:bg-amber-950/60 hover:border-amber-600 transition-colors flex items-center justify-between gap-2"
              >
                <span className="line-clamp-2">{state.nextAction}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <div className={`font-semibold text-xs line-clamp-2 ${state.delivered ? 'text-emerald-300' : 'text-zinc-300'}`}>
                {state.nextAction}
              </div>
            )}
            {job.nextAction && job.nextAction !== state.nextAction && (
              <div className="text-xs text-zinc-400 line-clamp-2" title={job.nextAction}>
                Agent note: {job.nextAction}
              </div>
            )}
          </div>

          {/* Blocker / Policy Pause */}
          <div className="md:px-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-400 uppercase text-xs tracking-wider">Active Blocker</div>
            {state.blocker ? (
              <div className="flex items-start gap-1.5 text-red-300 text-xs">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{state.blocker}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{state.delivered ? 'None (delivered)' : 'None'}</span>
              </div>
            )}
          </div>

          {/* Remaining Budget & Unit Economics */}
          <div className="md:pl-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-400 uppercase text-xs tracking-wider">Remaining Budget</div>
            {remainingBudget != null && maxApprovedSpend != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">{formatCurrency(remainingBudget)}</span>
                <span className="text-xs text-zinc-400">/ {formatCurrency(maxApprovedSpend)} cap</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-zinc-400">No spend cap locked</div>
            )}
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Reserved: {formatCurrency(reservedSpend)}</span>
              {contributionPct != null &&
                (contributionComplete ? (
                  <span className="text-cyan-400">Expected contribution: {contributionPct}%</span>
                ) : (
                  <span className="text-amber-300" title={`Missing: ${profitability?.missingCosts.join(', ')}`}>
                    Contribution incomplete
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* 6-Stage Progress Indicator Bar */}
        <div className="pt-2 border-t border-zinc-900">
          <div
            className="grid grid-cols-6 gap-1 bg-zinc-900/60 p-1 rounded-lg"
            role="tablist"
            aria-label="Job stages"
            onKeyDown={e => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const idx = STAGE_ORDER.indexOf(activeStage);
              const next = STAGE_ORDER[(idx + (e.key === 'ArrowRight' ? 1 : STAGE_ORDER.length - 1)) % STAGE_ORDER.length];
              onStageChange(next);
              (e.currentTarget.querySelector(`[data-stage="${next}"]`) as HTMLElement | null)?.focus();
            }}
          >
            {STAGES.map(s => {
              const isActive = activeStage === s.key;
              const stageStatus = state.stageStatus[s.key];
              return (
                <button
                  key={s.key}
                  data-stage={s.key}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onStageChange(s.key)}
                  aria-current={stageStatus === 'current' ? 'step' : undefined}
                  title={
                    stageStatus === 'upcoming'
                      ? `Not reached yet. Current step: ${state.nextAction}`
                      : stageStatus === 'done'
                      ? 'Completed'
                      : 'Current stage'
                  }
                  className={`py-2 px-1 text-center text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                      : stageStatus === 'upcoming'
                      ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
                      : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
                >
                  {stageStatus === 'done' && (
                    <CheckCircle2 className={`h-3 w-3 ${isActive ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  )}
                  {stageStatus === 'current' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                  )}
                  <span className="text-xs tracking-wider">{s.label}</span>
                  {!!stageBadges?.[s.key] && (
                    <span
                      className={`rounded-full px-1.5 text-xs ${
                        isActive ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {stageBadges[s.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. STAGE VIEWS */}

      {children}

      {/* STAGE 3: AUTHORISE */}
      {activeStage === 'authorise' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Client messages
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">All external messages require human sign-off</span>
            </div>

            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-zinc-400">No client messages drafted for this job.</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{msg.subject}</span>
                      <Badge variant="outline" className={`text-xs ${
                        msg.status === 'operator_authorised' ? 'text-emerald-400 border-emerald-800' :
                        msg.status === 'dispatched' ? 'text-cyan-400 border-cyan-800' : 'text-amber-400 border-amber-800'
                      }`}>
                        {msg.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-400">Channel: {msg.channel}</span>
                  </div>

                  <p className="text-zinc-300 whitespace-pre-wrap font-sans text-xs bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                    {msg.body}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-zinc-400">
                      {msg.contentHash ? (
                        <span>SHA-256 Seal: <span className="text-emerald-400">{msg.contentHash.substring(0, 16)}...</span></span>
                      ) : (
                        <span>Unsealed Draft</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.status === 'drafted' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAuthoriseMessage(msg.id)}
                          loading={authorising}
                          className="h-7 text-xs"
                        >
                          <Shield className="h-3 w-3 mr-1" /> Authorise (Compute Seal)
                        </Button>
                      )}
                      {msg.status === 'operator_authorised' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleDispatchMessage(msg.id)}
                          loading={dispatching === msg.id}
                          className="h-7 text-xs"
                        >
                          <Send className="h-3 w-3 mr-1" /> Dispatch to {msg.channel}
                        </Button>
                      )}
                      {msg.status === 'dispatched' && (
                        <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 5: REVIEW */}
      {activeStage === 'review' && (
        <div className="space-y-4">
          {/* QA-Assisted Defect Diagnostics & Recommendations */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  QA & repairs
                </h3>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-900 text-xs">
                QA Assisted
              </Badge>
            </div>

            <p className="text-xs text-zinc-400">
              Defect detection pinpoints the smallest failed component and provides a quoted repair recommendation for operator sign-off before execution.
            </p>

            {repairRuns.length === 0 && (
              <p className="text-xs text-zinc-400">No QA defects or repair runs recorded.</p>
            )}
            {repairRuns.map(run => (
              <div key={run.id} className="p-3 rounded border border-zinc-800 bg-zinc-950 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">
                    Failed Component: {run.qaResult.defectsDetected[0]?.component}
                  </span>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-800 text-xs">
                    {run.status}
                  </Badge>
                </div>
                <p className="text-zinc-400 font-sans text-xs">{run.actionDetails}</p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-900">
                  <span className="text-zinc-400">Model: {run.targetModel}</span>
                  <span className="text-amber-400 font-bold">Quoted Cost: ${run.estimatedCostUSD.toFixed(2)} (Example Quote)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bounded Revision Feedback Interpreter */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Feedback interpreter
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Decomposes subjective client requests into concrete candidate options before applying changes.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={revisionInput}
                onChange={e => setRevisionInput(e.target.value)}
                aria-label="Client feedback to interpret"
                placeholder="Paste client feedback, e.g. “Can the lighting feel warmer?”"
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none font-mono"
              />
              <Button
                size="sm"
                onClick={handleInterpretRevision}
                loading={revisionInterpreting}
                disabled={!revisionInput.trim()}
                className="shrink-0 text-xs"
              >
                Interpret
              </Button>
            </div>

            {revisionOptions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {revisionOptions.map((opt: any) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      opt.recommended
                        ? 'border-emerald-800 bg-emerald-950/20 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.title}</span>
                      {opt.recommended && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Recommended</Badge>}
                    </div>
                    <p className="text-xs font-sans text-zinc-300">{opt.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 6: DELIVER */}
      {activeStage === 'deliver' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Deliverables & sign-off
                </h3>
              </div>
              <Badge variant="outline" className="text-red-400 border-red-900 text-xs">
                Strict Human Invariant
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              Final delivery cannot be dispatched autonomously. The server endpoint strictly enforces operator signature verification.
            </p>

            <div className="space-y-2">
              {!job.verifiedDeliverables?.length && (
                <p className="text-xs text-zinc-400">No verified deliverables registered yet.</p>
              )}
              {job.verifiedDeliverables?.map((deliv, idx) => (
                <div key={idx} className="p-3 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-200 block">{deliv.name}</span>
                    <span className="text-zinc-400 text-xs">{deliv.technicalSpecs}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-900 text-xs">
                      {deliv.verified ? 'Verified Master' : 'Pending Verification'}
                    </Badge>
                    {deliv.fileSizeBytes && (
                      <span className="block text-xs text-zinc-400 mt-0.5">
                        {(deliv.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                {state.delivered ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Delivered
                    {job.approvalCheckpoints.finalDeliveryApprovedBy
                      ? ` · signed off by ${job.approvalCheckpoints.finalDeliveryApprovedBy}`
                      : ''}
                  </span>
                ) : state.produced ? (
                  <span>Hold status: Awaiting human operator sign-off</span>
                ) : (
                  <span>Final release unlocks after production and QA are complete.</span>
                )}
              </div>

              {!state.delivered && state.produced && (
                <Button variant="primary" onClick={openSignOff} className="text-xs font-bold">
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Authorise Final Release
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY SIGN-OFF MODAL (SERVER-ENFORCED INVARIANT) */}
      {deliverySignOffOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signoff-title"
          onKeyDown={e => e.key === 'Escape' && !delivering && setDeliverySignOffOpen(false)}
        >
          <div ref={signOffRef} className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-4 text-zinc-100 shadow-2xl text-xs">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 id="signoff-title" className="text-sm font-bold text-zinc-100">
                Final delivery sign-off
              </h3>
            </div>

            <p className="text-zinc-400 text-xs font-sans">
              You are certifying that all deliverables adhere to verified resolution, codec, and client brief requirements. Automated agents cannot perform this action.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="signoff-name" className="text-zinc-400 block mb-1">
                  Type your name to sign: <span className="text-zinc-200">{operatorName}</span>
                </label>
                <input
                  id="signoff-name"
                  type="text"
                  value={typedSignature}
                  onChange={e => setTypedSignature(e.target.value)}
                  autoComplete="off"
                  placeholder={operatorName}
                  className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
                <p className="mt-1 text-zinc-400 font-sans">
                  Not you? Change the operator name from the Studio menu in the header.
                </p>
              </div>

              <div>
                <label htmlFor="signoff-token" className="text-zinc-400 block mb-1">Signature Token</label>
                <input
                  id="signoff-token"
                  type="text"
                  value={signatureToken}
                  readOnly
                  className="w-full rounded bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 text-zinc-400 cursor-not-allowed"
                />
              </div>

              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedDeliverablesChecked}
                  onChange={e => setVerifiedDeliverablesChecked(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                />
                <span className="text-zinc-300 text-xs font-sans">
                  I verify that {deliverableNames.length ? `all ${deliverableNames.length} deliverables` : 'all deliverables'} have been
                  inspected against the approved brief and client brand constraints.
                </span>
              </label>
            </div>

            {deliveryError && (
              <div className="rounded bg-red-950/40 border border-red-800 p-2 text-red-300 text-xs">
                {deliveryError}
              </div>
            )}

            {deliverySuccess && (
              <div className="rounded bg-emerald-950/40 border border-emerald-800 p-2 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Final release signed and delivered successfully.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setDeliverySignOffOpen(false)} disabled={delivering}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalDeliverySignOff}
                loading={delivering}
                disabled={!signatureMatches || !verifiedDeliverablesChecked}
                className="font-bold"
              >
                Sign Off & Release Deliverables
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
