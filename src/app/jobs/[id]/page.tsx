'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
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
import { JobHeader } from '@/components/job-detail/JobHeader';
import { ApprovalTimeline } from '@/components/job-detail/ApprovalTimeline';
import { ProfitabilityPanel, JobEconomicsUpdate } from '@/components/job-detail/ProfitabilityPanel';
import { WorkflowStageWorkspace } from '@/components/job-detail/WorkflowStageWorkspace';
import { ClientMemoryModal } from '@/components/job-detail/ClientMemoryModal';
import { BriefTab } from '@/components/job-detail/BriefTab';
import { DecisionTab } from '@/components/job-detail/DecisionTab';
import { ReviewAnalysisScreen } from '@/components/job-detail/ReviewAnalysisScreen';
import { WorkflowTab } from '@/components/job-detail/WorkflowTab';
import { CostsTab } from '@/components/job-detail/CostsTab';
import { OutputsTab } from '@/components/job-detail/OutputsTab';
import { RevisionsTab } from '@/components/job-detail/RevisionsTab';
import { FileText, Sparkles, Layers, DollarSign, UserCheck } from 'lucide-react';
import { getJobState, StageKey, SectionKey } from '@/lib/job-state';
import { useToast, responseError } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Stages with more than one view get a secondary section switcher; the rest render a single stacked view
const STAGE_SECTIONS: Partial<Record<StageKey, { key: SectionKey; label: string; icon: React.ReactNode }[]>> = {
  brief: [
    { key: 'brief', label: 'Brief', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'decision', label: 'Astra decision', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { key: 'review', label: 'Review analysis', icon: <UserCheck className="h-3.5 w-3.5" /> },
  ],
  plan: [
    { key: 'workflow', label: 'Workflow', icon: <Layers className="h-3.5 w-3.5" /> },
    { key: 'costs', label: 'Costs & margins', icon: <DollarSign className="h-3.5 w-3.5" /> },
  ],
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;
  const toast = useToast();

  const [stage, setStage] = useState<StageKey>('brief');
  const [section, setSection] = useState<SectionKey>('brief');
  const stageInitialised = useRef(false);
  const [job, setJob] = useState<Job | null>(null);
  const [analysis, setAnalysis] = useState<BriefAnalysis | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilityMetrics | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [repairRuns, setRepairRuns] = useState<RepairRun[]>([]);
  const [showClientMemoryModal, setShowClientMemoryModal] = useState(false);
  const [clientMemoryId, setClientMemoryId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [buildingWorkflow, setBuildingWorkflow] = useState(false);

  const fetchJobData = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        setLoadError({
          notFound: res.status === 404,
          message: await responseError(res, 'Could not load this job'),
        });
        return;
      }
      const data = await res.json();
      setLoadError(null);
      if (data.success) {
        setJob(data.job);
        setAnalysis(data.analysis);
        setWorkflow(data.workflow);
        setGenerations(data.generations || []);
        setRevisions(data.revisions || []);
        setProfitability(data.profitability);
        setClientMemoryId(data.clientMemoryId ?? null);
        // Open on the stage that needs attention, but only on first load so refreshes don't yank the view
        if (!stageInitialised.current) {
          stageInitialised.current = true;
          const initialState = getJobState(data.job, { analysis: data.analysis, workflow: data.workflow });
          const target = initialState.actionTarget ?? { stage: initialState.currentStage };
          setStage(target.stage);
          setSection(target.section ?? STAGE_SECTIONS[target.stage]?.[0].key ?? 'brief');
        }
      }

      // Fetch client agent messages
      const agentRes = await fetch(`/api/jobs/${jobId}/client-agent`);
      const agentData = await agentRes.json();
      if (agentData.success) {
        setMessages(agentData.messages || []);
      }

      // Fetch repair runs
      const repairRes = await fetch(`/api/jobs/${jobId}/repair`);
      const repairData = await repairRes.json();
      if (repairData.success) {
        setRepairRuns(repairData.repairRuns || []);
      }
    } catch (err: any) {
      setLoadError({ notFound: false, message: err.message || 'Could not load this job' });
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  // Keep outputs and spend current while models are running, without a manual refresh
  const isGenerating = job?.status === 'Generating';
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(fetchJobData, 5000);
    return () => clearInterval(timer);
  }, [isGenerating, fetchJobData]);

  const goTo = (nextStage: StageKey, nextSection?: SectionKey) => {
    setStage(nextStage);
    setSection(nextSection ?? STAGE_SECTIONS[nextStage]?.[0].key ?? 'brief');
  };

  // Handler: Run Brief Analysis with GPT-6 Astra
  const handleAnalyzeBrief = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error(await responseError(res, 'Brief analysis failed'));
      await fetchJobData();
      goTo('brief', 'decision');
      toast.success('Brief analysed. Review the Astra decision.');
    } catch (e: any) {
      toast.error(e.message || 'Brief analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handler: Build Production Workflow
  const handleBuildWorkflow = async () => {
    try {
      setBuildingWorkflow(true);
      const res = await fetch(`/api/jobs/${jobId}/workflow`, { method: 'POST' });
      if (!res.ok) throw new Error(await responseError(res, 'Could not build the workflow'));
      await fetchJobData();
      goTo('plan', 'workflow');
      toast.success('Production workflow built. Review it, then lock the budget.');
    } catch (e: any) {
      toast.error(e.message || 'Could not build the workflow');
    } finally {
      setBuildingWorkflow(false);
    }
  };

  // Handler: Update Job Financial Settings (Channel Fee, Contingency)
  const handleUpdateJobConfig = async (updates: JobEconomicsUpdate) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Could not update job settings'));
      fetchJobData();
    } catch (e: any) {
      toast.error(e.message || 'Could not update job settings');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6" aria-busy="true" aria-label="Loading job">
        <div className="space-y-3 pb-4 border-b border-zinc-800">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !job || !profitability) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-3">
        <h1 className="text-lg font-semibold text-zinc-100">
          {loadError?.notFound ? 'Job not found' : "Couldn't load this job"}
        </h1>
        <p className="text-sm text-zinc-400">
          {loadError?.notFound
            ? 'It may have been deleted or the link is wrong.'
            : loadError?.message || 'Something went wrong while loading the job.'}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Link
            href="/"
            className="rounded-md border border-zinc-700 px-3.5 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Back to pipeline
          </Link>
          {!loadError?.notFound && (
            <button
              onClick={() => {
                setLoading(true);
                fetchJobData();
              }}
              className="rounded-md bg-zinc-100 px-3.5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const sections = STAGE_SECTIONS[stage];
  const sectionBadges: Partial<Record<SectionKey, number | undefined>> = {
    decision: analysis ? 1 : undefined,
    review: job.editedAnalysis?.isHumanEdited ? 1 : undefined,
    workflow: workflow?.steps.length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header with Job Title, Source, Budget, Status */}
      <JobHeader job={job} />

      {/* One navigation: summary strip + stage bar, with each stage hosting its views */}
      <WorkflowStageWorkspace
        job={job}
        analysis={analysis}
        workflow={workflow}
        generations={generations}
        revisions={revisions}
        profitability={profitability}
        messages={messages}
        repairRuns={repairRuns}
        onRefresh={fetchJobData}
        activeStage={stage}
        onStageChange={s => goTo(s)}
        stageBadges={{ produce: generations.length, review: revisions.length }}
        onNextAction={target => goTo(target.stage, target.section)}
      >
        {sections && (
          <div
            className="flex gap-1 overflow-x-auto border-b border-zinc-800"
            role="tablist"
            aria-label="Stage views"
            onKeyDown={e => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              const idx = sections.findIndex(sec => sec.key === section);
              const next = sections[(idx + (e.key === 'ArrowRight' ? 1 : sections.length - 1)) % sections.length].key;
              setSection(next);
              (e.currentTarget.querySelector(`[data-section="${next}"]`) as HTMLElement | null)?.focus();
            }}
          >
            {sections.map(sec => {
              const badge = sectionBadges[sec.key];
              const selected = section === sec.key;
              return (
                <button
                  key={sec.key}
                  role="tab"
                  data-section={sec.key}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setSection(sec.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
                    selected
                      ? 'border-zinc-100 text-zinc-100 font-bold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {sec.icon}
                  <span>{sec.label}</span>
                  {!!badge && (
                    <span className="rounded-full bg-zinc-800 px-1.5 text-xs text-zinc-300">{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {stage === 'brief' && section === 'brief' && (
          <BriefTab
            job={job}
            analysis={analysis}
            onAnalyze={handleAnalyzeBrief}
            analyzing={analyzing}
            onOpenClientMemory={clientMemoryId ? () => setShowClientMemoryModal(true) : undefined}
          />
        )}

        {stage === 'brief' && section === 'decision' && (
          <DecisionTab
            job={job}
            analysis={analysis}
            onBuildWorkflow={handleBuildWorkflow}
            buildingWorkflow={buildingWorkflow}
            onAnalyze={handleAnalyzeBrief}
            analyzing={analyzing}
            onOpenReview={() => goTo('brief', 'review')}
          />
        )}

        {stage === 'brief' && section === 'review' && (
          <ReviewAnalysisScreen
            job={job}
            originalAnalysis={job.originalAnalysis || analysis}
            currentEditedAnalysis={job.editedAnalysis || analysis}
            onRefresh={fetchJobData}
          />
        )}

        {stage === 'plan' && section === 'workflow' && (
          <WorkflowTab
            job={job}
            workflow={workflow}
            generations={generations}
            onRefresh={fetchJobData}
            onBuildWorkflow={handleBuildWorkflow}
            buildingWorkflow={buildingWorkflow}
          />
        )}

        {stage === 'plan' && section === 'costs' && (
          <>
            <ProfitabilityPanel job={job} profitability={profitability} onUpdateJobConfig={handleUpdateJobConfig} />
            <CostsTab job={job} profitability={profitability} workflow={workflow} generations={generations} />
          </>
        )}

        {stage === 'authorise' && (
          <ApprovalTimeline
            job={job}
            workflow={workflow}
            analysis={analysis}
            onRefresh={fetchJobData}
            onRequestFinalSignOff={() => goTo('deliver')}
          />
        )}

        {stage === 'produce' && (
          <OutputsTab job={job} generations={generations} workflow={workflow} onRefresh={fetchJobData} />
        )}

        {stage === 'review' && (
          <RevisionsTab job={job} revisions={revisions} analysis={analysis} onRefresh={fetchJobData} />
        )}
      </WorkflowStageWorkspace>

      {clientMemoryId && (
        <ClientMemoryModal
          isOpen={showClientMemoryModal}
          onClose={() => setShowClientMemoryModal(false)}
          clientId={clientMemoryId}
        />
      )}
    </div>
  );
}
