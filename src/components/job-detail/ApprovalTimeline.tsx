'use client';

import React, { useState } from 'react';
import { Job, Workflow, BriefAnalysis } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getJobState } from '@/lib/job-state';
import { useOperatorName } from '@/lib/operator';
import { useToast, responseError } from '../ui/toast';
import { Button } from '../ui/button';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ApprovalTimelineProps {
  job: Job;
  workflow?: Workflow | null;
  analysis?: BriefAnalysis | null;
  onRefresh: () => void;
  /** Final delivery is signed off in the Deliver stage (server-enforced signature), not here */
  onRequestFinalSignOff?: () => void;
}

export function ApprovalTimeline({ job, workflow, analysis, onRefresh, onRequestFinalSignOff }: ApprovalTimelineProps) {
  const [operatorName] = useOperatorName();
  const toast = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [customMaxBudget, setCustomMaxBudget] = useState<number>(
    job.maxApprovedBudget || Math.ceil((workflow?.totalEstimatedCost || 25) * 1.5)
  );

  const checkpoints = job.approvalCheckpoints;
  const state = getJobState(job, { analysis, workflow });

  const runApproval = async (key: string, payload: Record<string, unknown>, successMessage: string) => {
    try {
      setLoadingAction(key);
      const res = await fetch(`/api/jobs/${job.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, operatorName }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Approval failed'));
      toast.success(successMessage);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Approval failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveWorkflow = () =>
    runApproval(
      'approve_workflow',
      { action: 'approve_workflow_and_budget', maxApprovedBudget: customMaxBudget || 50 },
      `Workflow approved. Budget ceiling locked at ${formatCurrency(customMaxBudget || 50)}.`
    );

  const handleClearRights = () =>
    runApproval('clear_rights', { action: 'approve_rights' }, 'Rights flags cleared.');

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 mb-6 shadow-sm">
      {/* Banner Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Approvals
          </h3>
        </div>
        <div className="text-xs text-zinc-400">
          Agent autonomously operates <span className="text-amber-300 font-semibold">strictly within</span> approved limits
        </div>
      </div>

      {/* Interactive Timeline Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3">
        {/* Node 1: Workflow & Budget Limit */}
        <div
          className={`rounded-md border p-3 flex flex-col justify-between transition-colors ${
            state.budgetLocked
              ? 'border-emerald-800/60 bg-emerald-950/20'
              : 'border-amber-700/60 bg-amber-950/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Checkpoint 1</span>
              {state.budgetLocked ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" /> Action Required
                </span>
              )}
            </div>
            <h4 className="mt-1 text-xs font-semibold text-zinc-100">
              Workflow & Budget Ceiling
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-snug">
              Human must lock production model chain and maximum budget limit.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60">
            {state.budgetLocked ? (
              <div className="text-xs text-emerald-300">
                Locked at: <strong>{formatCurrency(job.maxApprovedBudget ?? checkpoints.maxBudgetAmount)}</strong>
                {checkpoints.workflowApprovedBy ? ` by ${checkpoints.workflowApprovedBy}` : ''}
                <div className="text-zinc-400">{formatDateTime(checkpoints.workflowApprovedAt)}</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">Max Spend ($):</span>
                  <input
                    type="number"
                    value={customMaxBudget}
                    aria-label="Maximum spend ceiling in dollars"
                    onChange={e => setCustomMaxBudget(Number(e.target.value))}
                    className="w-16 rounded bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-xs font-mono text-zinc-100"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full text-xs"
                  onClick={handleApproveWorkflow}
                  loading={loadingAction === 'approve_workflow'}
                  disabled={!workflow}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Approve & Lock Budget
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Node 2: Rights & IP Clearance */}
        <div
          className={`rounded-md border p-3 flex flex-col justify-between transition-colors ${
            state.rightsCleared
              ? 'border-emerald-800/60 bg-emerald-950/20'
              : 'border-amber-700/60 bg-amber-950/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Checkpoint 2</span>
              {state.rightsCleared ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Review IP
                </span>
              )}
            </div>
            <h4 className="mt-1 text-xs font-semibold text-zinc-100">
              Rights & Trademark Clearance
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-snug">
              Operator must verify no unauthorized likeness, trademark, or music audio infringement.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60">
            {state.rightsCleared ? (
              <div className="text-xs text-emerald-300">
                {checkpoints.rightsCleared ? `Cleared by ${checkpoints.rightsApprovedBy}` : 'Zero high-risk flags identified'}
              </div>
            ) : (
              <Button
                size="sm"
                variant="primary"
                className="w-full text-xs"
                onClick={handleClearRights}
                loading={loadingAction === 'clear_rights'}
              >
                Clear Rights Flags
              </Button>
            )}
          </div>
        </div>

        {/* Node 3: Model Pipeline Autonomous Run */}
        <div
          className={`rounded-md border p-3 flex flex-col justify-between transition-colors ${
            state.generating || state.produced
              ? 'border-cyan-800/60 bg-cyan-950/20'
              : 'border-zinc-800 bg-zinc-900/30 text-zinc-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-400">Autonomous Step</span>
              <span className="text-cyan-400 font-mono">
                {state.generating ? 'Active' : state.produced ? 'Completed' : state.budgetLocked && state.rightsCleared ? 'Ready' : 'Awaiting Unlock'}
              </span>
            </div>
            <h4 className="mt-1 text-xs font-semibold text-zinc-200">
              Higgsfield Model Generation
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-snug">
              Generates keyframes, camera motions, video, voice, and 4K masters inside authorized spend limit.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
            Governed by spend ceiling. Any overrun automatically halts.
          </div>
        </div>

        {/* Node 4: Final Client Delivery Sign-off */}
        <div
          className={`rounded-md border p-3 flex flex-col justify-between transition-colors ${
            state.delivered
              ? 'border-emerald-800/60 bg-emerald-950/20'
              : state.produced
              ? 'border-amber-700/60 bg-amber-950/30'
              : 'border-zinc-800 bg-zinc-900/30 text-zinc-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Checkpoint 3</span>
              {state.delivered ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                </span>
              ) : state.produced ? (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" /> Sign-off Ready
                </span>
              ) : (
                <span className="text-zinc-400">Pending QA</span>
              )}
            </div>
            <h4 className="mt-1 text-xs font-semibold text-zinc-100">
              Final Delivery Sign-off
            </h4>
            <p className="mt-1 text-xs text-zinc-400 leading-snug">
              Manual human sign-off required to export client delivery packages.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60">
            {state.delivered ? (
              <div className="text-xs text-emerald-300">
                {checkpoints.finalDeliveryApprovedBy
                  ? `Delivered & signed off by ${checkpoints.finalDeliveryApprovedBy}`
                  : 'Delivered'}
              </div>
            ) : state.produced ? (
              <Button
                size="sm"
                variant="primary"
                className="w-full text-xs"
                onClick={onRequestFinalSignOff}
                disabled={!onRequestFinalSignOff}
              >
                Go to final sign-off
              </Button>
            ) : (
              <div className="text-xs text-zinc-400">
                Awaiting QA completion
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
