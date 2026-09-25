'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Job } from '@/types';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { PipelineView } from '@/components/dashboard/PipelineView';
import { NewJobModal } from '@/components/dashboard/NewJobModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { responseError } from '@/components/ui/toast';
import { Plus, Search, Filter, ArrowRight, X } from 'lucide-react';
import { getJobState, daysUntil } from '@/lib/job-state';
import { formatDate } from '@/lib/utils';

const SOURCES = ['All', 'Upwork', 'Contra', 'Fiverr', 'Email', 'Direct Lead'];

/** Waiting-on-you jobs first, then by nearest deadline */
function urgencyCompare(a: Job, b: Job): number {
  const aWaiting = getJobState(a).waitingOn ? 0 : 1;
  const bWaiting = getJobState(b).waitingOn ? 0 : 1;
  if (aWaiting !== bWaiting) return aWaiting - bWaiting;
  return (daysUntil(a.deadline) ?? Infinity) - (daysUntil(b.deadline) ?? Infinity);
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [waitingOnly, setWaitingOnly] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(await responseError(res, 'Could not load jobs'));
      const data = await res.json();
      setJobs(data.jobs);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err.message || 'Could not load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // No manual refresh needed: refetch when the tab regains focus, and poll while anything is generating
  useEffect(() => {
    const onFocus = () => fetchJobs();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchJobs]);

  const anyGenerating = jobs.some(j => j.status === 'Generating');
  useEffect(() => {
    if (!anyGenerating) return;
    const timer = setInterval(fetchJobs, 10000);
    return () => clearInterval(timer);
  }, [anyGenerating, fetchJobs]);

  const needsYou = useMemo(
    () => jobs.filter(j => getJobState(j).waitingOn).sort(urgencyCompare),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return jobs
      .filter(job => {
        const matchesSearch =
          job.title.toLowerCase().includes(q) ||
          job.clientName.toLowerCase().includes(q) ||
          job.rawBrief.toLowerCase().includes(q);
        const matchesSource = sourceFilter === 'All' || job.source === sourceFilter;
        const matchesWaiting = !waitingOnly || !!getJobState(job).waitingOn;
        return matchesSearch && matchesSource && matchesWaiting;
      })
      .sort(urgencyCompare);
  }, [jobs, searchQuery, sourceFilter, waitingOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Title & primary action */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Pipeline</h1>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)} className="text-sm font-semibold">
          <Plus className="h-4 w-4" />
          New job
        </Button>
      </div>

      {/* What needs the operator right now */}
      {!loading && needsYou.length > 0 && (
        <section
          aria-label="Needs you now"
          className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-sm font-semibold text-amber-200">
              Needs you now <span className="text-amber-400/80 font-normal">({needsYou.length})</span>
            </h2>
            {needsYou.length > 3 && (
              <button onClick={() => setWaitingOnly(true)} className="text-xs text-amber-300 hover:text-amber-100 underline">
                Show all on board
              </button>
            )}
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {needsYou.slice(0, 3).map(job => {
              const state = getJobState(job);
              const days = daysUntil(job.deadline);
              return (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2 hover:border-amber-700/60 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-zinc-100">{job.title}</span>
                      <span className="block text-xs text-amber-300">
                        {state.waitingOn}
                        <span className={days !== null && days <= 3 ? 'text-red-300' : 'text-zinc-400'}>
                          {' · '}
                          {days === null ? 'No deadline' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due ${formatDate(job.deadline)}`}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-amber-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Metric KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      ) : (
        <MetricCards jobs={jobs} waitingOnly={waitingOnly} onToggleWaitingOnly={() => setWaitingOnly(w => !w)} />
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" aria-hidden />
          <input
            type="search"
            aria-label="Search jobs"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search briefs, clients, or keywords..."
            className="w-full rounded bg-zinc-900/80 border border-zinc-800 pl-8 pr-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          {waitingOnly && (
            <button
              onClick={() => setWaitingOnly(false)}
              className="flex items-center gap-1 rounded-full border border-amber-700/60 bg-amber-950/30 px-2.5 py-1 text-amber-200 hover:bg-amber-950/60"
            >
              Waiting on you <X className="h-3 w-3" aria-label="Clear filter" />
            </button>
          )}
          <Filter className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          <span id="source-filter-label">Source:</span>
          <div role="group" aria-labelledby="source-filter-label" className="flex flex-wrap gap-1">
            {SOURCES.map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                aria-pressed={sourceFilter === src}
                className={`px-2 py-1 rounded transition-colors ${
                  sourceFilter === src
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      {loadError ? (
        <div role="alert" className="rounded-lg border border-red-800/50 bg-red-950/30 p-6 text-center space-y-3">
          <p className="text-sm text-red-200">{loadError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchJobs();
            }}
          >
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="flex gap-3" aria-busy="true" aria-label="Loading pipeline">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[420px] flex-1 min-w-[240px]" />
          ))}
        </div>
      ) : (
        <PipelineView jobs={filteredJobs} />
      )}

      <NewJobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={fetchJobs} />
    </div>
  );
}
