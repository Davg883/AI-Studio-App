import React from 'react';
import { Job } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, ShieldAlert, Film, TrendingUp } from 'lucide-react';
import { getJobState } from '@/lib/job-state';

interface MetricCardsProps {
  jobs: Job[];
  waitingOnly?: boolean;
  onToggleWaitingOnly?: () => void;
}

export function MetricCards({ jobs, waitingOnly, onToggleWaitingOnly }: MetricCardsProps) {
  const totalPipelineBudget = jobs.reduce((sum, j) => sum + (j.budget || 0), 0);

  // Same rule as the "waiting on" label on each pipeline card
  const pendingHumanApprovals = jobs.filter(j => getJobState(j).waitingOn !== null).length;

  const inActiveProduction = jobs.filter(
    j => j.status === 'Approved' || j.status === 'Generating' || j.status === 'QA'
  ).length;

  const deliveredJobs = jobs.filter(j => getJobState(j).delivered).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1 */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Total Inbound Pipeline</span>
          <DollarSign className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-semibold text-zinc-100">
            {formatCurrency(totalPipelineBudget)}
          </span>
          <span className="text-xs text-zinc-400 font-mono">{jobs.length} briefs</span>
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          Average brief value: {jobs.length ? formatCurrency(totalPipelineBudget / jobs.length) : '$0'}
        </div>
      </div>

      {/* Metric 2: doubles as a filter for jobs waiting on the operator */}
      <button
        type="button"
        onClick={onToggleWaitingOnly}
        aria-pressed={!!waitingOnly}
        title={waitingOnly ? 'Show all jobs' : 'Show only jobs waiting on you'}
        className={`text-left rounded-lg border p-3.5 flex flex-col justify-between transition-colors ${
          waitingOnly
            ? 'border-amber-700/70 bg-amber-950/30'
            : 'border-zinc-800/80 bg-zinc-900/40 hover:border-amber-800/60 hover:bg-zinc-900/70'
        }`}
      >
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Human Checkpoints</span>
          <ShieldAlert className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-semibold text-amber-300">
            {pendingHumanApprovals}
          </span>
          <span className="text-xs text-amber-400/80 font-mono">jobs waiting on you</span>
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          {waitingOnly ? 'Filtering the board · click to clear' : 'Click to filter the board'}
        </div>
      </button>

      {/* Metric 3 */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Active In Production</span>
          <Film className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-semibold text-cyan-200">
            {inActiveProduction}
          </span>
          <span className="text-xs text-zinc-400 font-mono">jobs generating / QA</span>
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          Operating strictly within approved spend
        </div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs uppercase tracking-wider">Completed Deliveries</span>
          <TrendingUp className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-semibold text-purple-200">
            {deliveredJobs}
          </span>
          <span className="text-xs text-zinc-400 font-mono">signed-off</span>
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          Standard gross margin target: ~85%
        </div>
      </div>
    </div>
  );
}
