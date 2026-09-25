'use client';

import React from 'react';
import { Job, BriefAnalysis } from '@/types';
import { Button } from '../ui/button';
import { getJobState } from '@/lib/job-state';
import { Sparkles, FileText, ExternalLink, ShieldCheck, Shield, HelpCircle, Image as ImageIcon } from 'lucide-react';

interface BriefTabProps {
  job: Job;
  analysis?: BriefAnalysis | null;
  onAnalyze: () => void;
  analyzing: boolean;
  onOpenClientMemory?: () => void;
}

export function BriefTab({ job, analysis, onAnalyze, analyzing, onOpenClientMemory }: BriefTabProps) {
  // Re-analysing after the plan and budget are locked would silently diverge from what was approved
  const planLocked = getJobState(job, { analysis }).budgetLocked;
  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Raw Client Brief Intake
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pasted verbatim from {job.source}. Ingested manually with strict zero-scrape policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-auto self-start">
          {onOpenClientMemory && (
            <Button variant="outline" size="sm" onClick={onOpenClientMemory} className="text-xs border-zinc-700">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Client memory
            </Button>
          )}
          {planLocked ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Analysed · plan locked
            </span>
          ) : (
            <Button
              variant={analysis ? 'outline' : 'primary'}
              onClick={onAnalyze}
              loading={analyzing}
              className="text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
              {analysis ? 'Re-Analyze with GPT-6 Astra' : 'Analyze Brief with GPT-6 Astra'}
            </Button>
          )}
        </div>
      </div>

      {/* Open questions surfaced by the analysis */}
      {analysis && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Open questions for client
          </span>
          {analysis.questionsForClient?.length ? (
            <ul className="space-y-1">
              {analysis.questionsForClient.map((q, i) => (
                <li key={i} className="text-xs text-amber-300">
                  • {q}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-400">No open questions. The brief covers everything material.</p>
          )}
        </div>
      )}

      {/* Raw Brief Text Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2">
          Verbatim Brief Text
        </span>
        <div className="rounded border border-zinc-800/80 bg-zinc-900/50 p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-200 leading-relaxed">
            {job.rawBrief}
          </pre>
        </div>
      </div>

      {/* Client Notes & Reference Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2">
            Internal Operator Notes
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {job.clientNotes || 'No special operator notes logged during intake.'}
          </p>
        </div>

        {/* Reference Assets */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2">
            Client Attached References & Moodboards ({job.referenceAssets?.length || 0})
          </span>
          {job.referenceAssets && job.referenceAssets.length > 0 ? (
            <div className="space-y-2">
              {job.referenceAssets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 p-2 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono text-zinc-200 truncate">{asset.name}</span>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 shrink-0 ml-2"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 py-2">
              No external reference files attached.
            </div>
          )}
        </div>
      </div>

      {/* Safety Policy Notice */}
      <div className="rounded-md border border-zinc-800/80 bg-zinc-900/20 p-3 text-xs text-zinc-400 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          Autonomous marketplace interaction guardrail is active. Proposals, contracting, and deliveries cannot be executed via automated bots.
        </span>
      </div>
    </div>
  );
}
