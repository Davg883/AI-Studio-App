'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Job, JobStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, Loader2, ChevronsRightLeft } from 'lucide-react';
import { getJobState, daysUntil } from '@/lib/job-state';
import { formatMoney, jobCurrency } from '@/lib/money';

interface PipelineViewProps {
  jobs: Job[];
}

const STAGES: { status: JobStatus; title: string; color: string; description: string }[] = [
  { status: 'New', title: 'New', color: 'border-blue-500/30 text-blue-400', description: 'Raw brief intake; awaiting GPT-6 analysis' },
  { status: 'Needs Review', title: 'Needs Review', color: 'border-amber-500/30 text-amber-400', description: 'Analysis complete; awaiting operator sign-off' },
  { status: 'Approved', title: 'Approved', color: 'border-emerald-500/30 text-emerald-400', description: 'Workflow & budget ceiling locked' },
  { status: 'Generating', title: 'Generating', color: 'border-cyan-500/30 text-cyan-400', description: 'Higgsfield model pipeline running' },
  { status: 'QA', title: 'QA Review', color: 'border-purple-500/30 text-purple-400', description: 'Generations ready for operator sign-off' },
  { status: 'Delivered', title: 'Delivered', color: 'border-zinc-500/30 text-zinc-400', description: 'Operator approved client delivery' },
  { status: 'Rejected', title: 'Rejected', color: 'border-red-500/30 text-red-400', description: 'Scope/budget incompatible' },
];

function deadlineLabel(deadline: string, closed: boolean): { text: string; className: string } {
  const days = daysUntil(deadline);
  const date = formatDate(deadline);
  if (closed || days === null) return { text: `Due ${date}`, className: 'text-zinc-400' };
  if (days < 0) return { text: `Overdue ${Math.abs(days)}d · ${date}`, className: 'text-red-400 font-semibold' };
  if (days === 0) return { text: `Due today · ${date}`, className: 'text-red-400 font-semibold' };
  if (days <= 3) return { text: `Due in ${days}d · ${date}`, className: 'text-amber-400 font-semibold' };
  if (days <= 7) return { text: `Due in ${days}d · ${date}`, className: 'text-zinc-300' };
  return { text: `Due ${date}`, className: 'text-zinc-400' };
}

// Closed stages start folded; any empty stage also folds so the active columns fit on screen
const FOLDED_BY_DEFAULT: JobStatus[] = ['Delivered', 'Rejected'];

export function PipelineView({ jobs }: PipelineViewProps) {
  // Explicit operator choice per column; undefined falls back to the default rule
  const [expandedOverride, setExpandedOverride] = useState<Partial<Record<JobStatus, boolean>>>({});
  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'Upwork':
        return 'success';
      case 'Contra':
        return 'purple';
      case 'Fiverr':
        return 'warning';
      case 'Direct Lead':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start min-h-[520px]">
      {STAGES.map(stage => {
        const stageJobs = jobs.filter(j => j.status === stage.status);
        const expanded =
          expandedOverride[stage.status] ??
          (stageJobs.length > 0 && !FOLDED_BY_DEFAULT.includes(stage.status));
        const toggle = () => setExpandedOverride(prev => ({ ...prev, [stage.status]: !expanded }));

        if (!expanded) {
          return (
            <button
              key={stage.status}
              onClick={toggle}
              title={`${stage.title}: ${stage.description}. Click to expand.`}
              aria-expanded={false}
              aria-label={`Expand ${stage.title} column (${stageJobs.length} jobs)`}
              className="flex-shrink-0 w-11 self-stretch min-h-[240px] max-h-[calc(100vh-220px)] rounded-lg border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-700 transition-colors flex flex-col items-center gap-3 py-3"
            >
              <span className="rounded-full bg-zinc-800 px-1.5 text-xs font-mono text-zinc-400">
                {stageJobs.length}
              </span>
              <span
                className={`text-xs font-semibold tracking-wider uppercase [writing-mode:vertical-rl] ${stage.color}`}
              >
                {stage.title}
              </span>
            </button>
          );
        }

        return (
          <div
            key={stage.status}
            className="flex-1 basis-0 min-w-[240px] rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex flex-col max-h-[calc(100vh-220px)]"
          >
            {/* Column Header */}
            <div
              className="p-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/30 rounded-t-lg"
              title={stage.description}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold tracking-wider uppercase ${stage.color}`}>
                  {stage.title}
                </span>
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-xs font-mono text-zinc-400">
                  {stageJobs.length}
                </span>
              </div>
              <button
                onClick={toggle}
                aria-expanded
                aria-label={`Collapse ${stage.title} column`}
                title="Collapse column"
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <ChevronsRightLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
              {stageJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No jobs
                </div>
              ) : (
                stageJobs.map(job => {
                  const state = getJobState(job);
                  const due = deadlineLabel(job.deadline, state.delivered || state.rejected);

                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block group rounded-md border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-sm"
                    >
                      {/* Top row: Source badge & Budget */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Badge variant={getSourceBadgeVariant(job.source) as any} className="text-xs">
                            {job.source}
                          </Badge>
                          {job.isDemo && (
                            <Badge
                              variant="outline"
                              className="text-xs border-sky-800 text-sky-300"
                              title="Demonstration scenario, not a commissioned job"
                            >
                              Demo
                            </Badge>
                          )}
                        </span>
                        <span className="text-sm font-mono font-semibold text-emerald-400">
                          {formatMoney(job.budget, jobCurrency(job))}
                        </span>
                      </div>

                      {/* Title & Client */}
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 line-clamp-2 leading-snug">
                        {job.title}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-400 truncate">
                        {job.clientName}
                      </p>

                      {/* What this job is waiting on (derived from the shared job state) */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {state.waitingOn ? (
                            <span className="flex items-center gap-1 text-amber-400">
                              <ShieldAlert className="h-3 w-3" />
                              {state.waitingOn}
                            </span>
                          ) : state.generating ? (
                            <span className="flex items-center gap-1 text-cyan-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating
                            </span>
                          ) : state.delivered ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Delivered
                            </span>
                          ) : state.rejected ? (
                            <span className="text-zinc-400">Closed</span>
                          ) : (
                            <span className="flex items-center gap-1 text-zinc-300">
                              <CheckCircle2 className="h-3 w-3 text-zinc-400" />
                              Cleared to generate
                            </span>
                          )}
                          {state.budgetLocked && job.maxApprovedBudget != null && (
                            <span className="flex items-center gap-1 text-emerald-400" title="Approved provider spend ceiling (USD)">
                              <ShieldCheck className="h-3 w-3" />
                              {formatCurrency(job.maxApprovedBudget)} cap
                            </span>
                          )}
                        </div>

                        {/* Deadline row, coloured by urgency */}
                        <div className={`flex items-center gap-1 text-xs ${due.className}`}>
                          <Clock className="h-3 w-3" />
                          {due.text}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
