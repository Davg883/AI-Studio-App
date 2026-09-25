'use client';

import React from 'react';
import { BriefAnalysis, Job } from '@/types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getJobState } from '@/lib/job-state';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Film,
  Maximize2,
  Clock,
  Quote,
  ShieldAlert,
  HelpCircle,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface DecisionTabProps {
  job: Job;
  analysis?: BriefAnalysis | null;
  onBuildWorkflow: () => void;
  buildingWorkflow: boolean;
  onAnalyze: () => void;
  analyzing: boolean;
  onOpenReview?: () => void;
}

export function DecisionTab({
  job,
  analysis,
  onBuildWorkflow,
  buildingWorkflow,
  onAnalyze,
  analyzing,
  onOpenReview,
}: DecisionTabProps) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-amber-400 mb-3" />
        <h3 className="text-base font-semibold text-zinc-200">
          Brief Has Not Been Analyzed
        </h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
          Run GPT-6 Astra with OpenAI Structured Outputs to extract deliverables, verify rights & likeness scrutiny, and generate deterministic recommendations.
        </p>
        <div className="mt-5">
          <Button variant="primary" onClick={onAnalyze} loading={analyzing}>
            Run GPT-6 Astra Analysis
          </Button>
        </div>
      </div>
    );
  }

  const normalizedDecision = (analysis.decision || '').toLowerCase();
  // Once the plan and budget are locked, re-editing the analysis or rebuilding the workflow is no longer offered
  const planLocked = getJobState(job, { analysis }).budgetLocked;

  const getDecisionBadge = () => {
    if (normalizedDecision === 'accept') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 text-xs font-mono font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Decision: ACCEPT
        </span>
      );
    }
    if (normalizedDecision === 'reject') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/80 border border-red-700/60 px-3 py-1 text-xs font-mono font-bold text-red-300">
          <XCircle className="h-4 w-4 text-red-400" />
          Decision: REJECT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-700/60 px-3 py-1 text-xs font-mono font-bold text-amber-300">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        Decision: HUMAN REVIEW
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Decision Banner */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center gap-3">
            {getDecisionBadge()}
            <span className="text-xs font-mono text-zinc-400">
              Confidence:{' '}
              <strong className="text-zinc-200">{analysis.confidence}%</strong>
            </span>
            {analysis.isHumanEdited && (
              <Badge variant="warning" className="text-xs">
                Operator Edited
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {planLocked && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Plan & budget locked
              </span>
            )}
            {!planLocked && onOpenReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenReview}
                className="text-xs border-amber-800/60 text-amber-300 hover:bg-amber-950/30"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Review & Edit Analysis
              </Button>
            )}

            {!planLocked && (
              <Button
                variant="primary"
                size="sm"
                onClick={onBuildWorkflow}
                loading={buildingWorkflow}
                className="text-xs"
              >
                <Layers className="h-3.5 w-3.5 mr-1" />
                Build Production Workflow <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Deterministic Evaluation Reasons & Strategic Rationale */}
        <div className="mt-4 rounded border border-zinc-800/80 bg-zinc-900/50 p-3.5 text-xs text-zinc-200 leading-relaxed space-y-2">
          <div>
            <strong className="text-amber-400 font-semibold block mb-1">
              DETERMINISTIC EVALUATION REASONS:
            </strong>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              {(analysis.decisionReasons || [analysis.rationale]).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>

          {analysis.conciseSummary && (
            <div className="pt-2 border-t border-zinc-800/60 text-zinc-400">
              <strong className="text-zinc-300">Summary:</strong> {analysis.conciseSummary}
            </div>
          )}
        </div>
      </div>

      {/* Deliverables Breakdown */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs text-zinc-300 flex items-center gap-2">
            <Film className="h-4 w-4 text-cyan-400" />
            Structured Deliverables ({analysis.deliverables.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-2 font-medium">Deliverable</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Format</th>
                <th className="pb-2 font-medium">Aspect / Res</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Exact Text Requirements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {analysis.deliverables.map((del, idx) => (
                <tr key={idx} className="text-zinc-200">
                  <td className="py-2.5 font-semibold text-zinc-100">{del.name}</td>
                  <td className="py-2.5 text-zinc-400">{del.type}</td>
                  <td className="py-2.5 text-zinc-400">{del.format}</td>
                  <td className="py-2.5 text-cyan-300">
                    {del.aspectRatio} • {del.resolution}
                  </td>
                  <td className="py-2.5 text-amber-300">
                    {del.durationSeconds ? `${del.durationSeconds}s` : 'Still'}
                  </td>
                  <td className="py-2.5 text-zinc-400 max-w-xs">
                    {del.exactTextRequirements?.length
                      ? del.exactTextRequirements.join(', ')
                      : 'None required'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Risks, Revision Risk, Proposed Workflow Capabilities */}
      {analysis.proposedWorkflow && analysis.proposedWorkflow.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
          <h4 className="text-xs text-zinc-300 flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-cyan-400" />
            Proposed Workflow Capabilities (Model Catalog Mapped)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analysis.proposedWorkflow.map((step, idx) => {
              const attempts = analysis.estimatedAttemptsByStep?.[step.stepName] || 2;
              return (
                <div key={idx} className="rounded border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
                  <div className="font-semibold text-zinc-200">{step.stepName}</div>
                  <div className="text-xs text-cyan-400 mt-0.5">
                    Capability: <code>{step.capabilityNeeded}</code>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{step.purpose}</div>
                  <div className="mt-2 text-xs text-amber-300 border-t border-zinc-800 pt-1">
                    Est. Attempts: {attempts}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rights Concerns & Brand Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rights Concerns */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Rights, Likeness & Consent Flags
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Human Clearance Enforced
            </span>
          </div>

          <div className="space-y-2.5">
            {(analysis.rightsAndConsentFlags || []).map((rc, idx) => (
              <div
                key={idx}
                className={`rounded border p-3 text-xs ${
                  rc.severity === 'high'
                    ? 'border-red-900/50 bg-red-950/20 text-red-200'
                    : rc.severity === 'medium'
                    ? 'border-amber-900/50 bg-amber-950/20 text-amber-200'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold uppercase tracking-wider text-xs">
                    Severity: {rc.severity}
                  </span>
                  {rc.approved ? (
                    <span className="text-emerald-400 text-xs">Cleared</span>
                  ) : rc.severity !== 'low' ? (
                    <span className="text-amber-400 text-xs">
                      Approval Required
                    </span>
                  ) : null}
                </div>
                <p className="text-zinc-200 font-semibold">{rc.flag}</p>
                <p className="text-zinc-400 text-xs mt-1">{rc.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Information & Brand Constraints */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              Missing Assets & Questions for Client
            </span>
            {(analysis.missingAssets || []).length > 0 ? (
              <ul className="space-y-1.5">
                {(analysis.missingAssets || []).map((info, idx) => (
                  <li
                    key={idx}
                    className="rounded bg-amber-950/20 border border-amber-900/30 p-2 text-xs text-amber-200 flex items-start gap-1.5"
                  >
                    <span>•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-zinc-400">
                No essential client assets marked as missing.
              </div>
            )}
          </div>

          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-2">
              Brand Constraints & Guardrails
            </span>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
              {(analysis.brandConstraints || []).map((constraint, idx) => (
                <li key={idx}>{constraint}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
