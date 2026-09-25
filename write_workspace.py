import os

workspace_code = """'use client';

import React, { useState } from 'react';
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
  onOpenClientMemory?: () => void;
}

type StageKey = 'brief' | 'plan' | 'authorise' | 'produce' | 'review' | 'deliver';

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
  onOpenClientMemory,
}: WorkflowStageWorkspaceProps) {
  const [activeStage, setActiveStage] = useState<StageKey>(
    (job.activeStage as StageKey) || 'brief'
  );
  const [authorising, setAuthorising] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [deliverySignOffOpen, setDeliverySignOffOpen] = useState(false);
  const [operatorName, setOperatorName] = useState('David (Human Operator)');
  const [signatureToken, setSignatureToken] = useState('OP-SIG-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [delivering, setDelivering] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [verifiedDeliverablesChecked, setVerifiedDeliverablesChecked] = useState(true);

  // Revision interpreter state
  const [revisionInput, setRevisionInput] = useState('Can we make the lighting warmer and more hopeful for the morning beach walker reveal?');
  const [revisionInterpreting, setRevisionInterpreting] = useState(false);
  const [revisionOptions, setRevisionOptions] = useState<any[] | null>(null);

  // Financial calculations
  const totalBudget = job.budget || 1235.0;
  const maxApprovedSpend = job.maxApprovedBudget || workflow?.maxApprovedSpend || 25.0;
  const actualGenSpend = generations.reduce((acc, g) => acc + (g.actualCost || g.costEstimate || 0), 0);
  const reservedSpend = job.reservedSpend || 0;
  const remainingBudget = Math.max(0, maxApprovedSpend - (actualGenSpend + reservedSpend));
  const laborHours = job.laborHoursEstimated || 3.5;
  const laborRate = job.laborRatePerHourUSD || 65.0;
  const laborCost = laborHours * laborRate;
  const netProfit = totalBudget - (actualGenSpend + laborCost);
  const netMarginPct = Number(((netProfit / totalBudget) * 100).toFixed(1));

  // Authorise message handler
  const handleAuthoriseMessage = async (messageId: string) => {
    try {
      setAuthorising(true);
      const res = await fetch(`/api/jobs/${job.id}/client-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authorise_message', messageId, operatorName }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Dispatch failed');
      } else {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      if (data.success && data.interpretation) {
        setRevisionOptions(data.interpretation.interpretationOptions || []);
      }
    } catch (e) {
      console.error(e);
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
            notes: 'Verified 1080p master reel, cutdowns, and dish photography stills released.',
          },
          verifiedFormatsConfirmed: verifiedDeliverablesChecked,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeliveryError(data.error || 'Delivery sign-off failed');
      } else {
        setDeliverySuccess(true);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800 text-xs font-mono">
          {/* Status & Active Stage */}
          <div className="pr-2 space-y-1.5">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Production Stage</div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-zinc-100 text-sm capitalize">
                Stage: {activeStage}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">Job Status: {job.status}</div>
          </div>

          {/* Next Action */}
          <div className="md:px-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Next Action</div>
            <div className="font-semibold text-amber-300 text-xs line-clamp-2">
              {job.nextAction || 'Review approved plate presentation and authorize message draft'}
            </div>
            <div className="text-[10px] text-zinc-500">Supervised process queue</div>
          </div>

          {/* Blocker / Policy Pause */}
          <div className="md:px-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Active Blocker</div>
            {job.approvalCheckpoints.finalDeliveryApproved ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Zero Blockers (Delivered)</span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 text-red-300 text-xs">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{job.activeBlocker || 'Final operator sign-off required prior to client release'}</span>
              </div>
            )}
          </div>

          {/* Remaining Budget & Unit Economics */}
          <div className="md:pl-4 pt-2 md:pt-0 space-y-1.5">
            <div className="text-zinc-500 uppercase text-[10px] tracking-wider">Remaining Budget</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-400">${remainingBudget.toFixed(2)}</span>
              <span className="text-[11px] text-zinc-400">/ ${maxApprovedSpend.toFixed(2)} cap</span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Reserved: ${reservedSpend.toFixed(2)}</span>
              <span className="text-cyan-400">Net Margin: {netMarginPct}%</span>
            </div>
          </div>
        </div>

        {/* 6-Stage Progress Indicator Bar */}
        <div className="pt-2 border-t border-zinc-900">
          <div className="grid grid-cols-6 gap-1 bg-zinc-900/60 p-1 rounded-lg">
            {STAGES.map(s => {
              const isActive = activeStage === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStage(s.key)}
                  className={`py-2 px-1 text-center text-xs font-mono font-medium rounded transition-all flex flex-col items-center gap-1 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-[10px] tracking-wider">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. STAGE VIEWS */}

      {/* STAGE 1: BRIEF */}
      {activeStage === 'brief' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                  Client Objective & Approved Facts
                </h3>
              </div>
              {onOpenClientMemory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenClientMemory}
                  className="text-xs font-mono border-zinc-700 h-7"
                >
                  <Shield className="h-3 w-3 mr-1 text-emerald-400" />
                  View Client Memory Vault
                </Button>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{job.rawBrief}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <span className="text-zinc-400 font-semibold block uppercase text-[10px]">Approved Reference Assets</span>
                {job.referenceAssets?.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1 border-b border-zinc-900 last:border-0">
                    <span className="text-zinc-200 text-[11px] truncate max-w-[220px]">{r.name}</span>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline text-[10px] flex items-center gap-1">
                      inspect <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <span className="text-zinc-400 font-semibold block uppercase text-[10px]">Material Questions Filtered</span>
                <p className="text-[11px] text-zinc-300">
                  The agent filters out casual chatter and prompts only for inputs materially impacting quality, cost, rights, or deadlines.
                </p>
                <div className="text-[11px] text-amber-300 font-semibold pt-1">
                  • Kitchen opening hours and owner sign-off confirmed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: PLAN */}
      {activeStage === 'plan' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                Verified Production Route & Operations
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Every step maps to a verified provider operation, deterministic quote, and supported input schema.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                    <th className="py-2">Step</th>
                    <th>Role</th>
                    <th>Exact Model ID</th>
                    <th>Operation</th>
                    <th>Quote</th>
                    <th>Quote Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-200">
                  <tr>
                    <td className="py-2.5 font-semibold text-zinc-100">1. Concept Stills</td>
                    <td><Badge variant="outline" className="text-[10px] text-amber-300">SEARCH</Badge></td>
                    <td>bytedance/seedream-4.0/text-to-image</td>
                    <td>text-to-image</td>
                    <td>$0.05 / still</td>
                    <td><span className="text-emerald-400 text-[10px]">Verified Catalog</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-zinc-100">2. Hero Motion Pass</td>
                    <td><Badge variant="outline" className="text-[10px] text-emerald-300">SHIP</Badge></td>
                    <td>bytedance/seedance-2.5/text-to-video</td>
                    <td>text-to-video</td>
                    <td>$1.50 / 5s</td>
                    <td><span className="text-emerald-400 text-[10px]">Verified Catalog</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-zinc-100">3. Inpaint Repair</td>
                    <td><Badge variant="outline" className="text-[10px] text-cyan-300">CONTROL</Badge></td>
                    <td>qwen/image-edit-2.0/inpaint</td>
                    <td>inpaint</td>
                    <td>$0.15 / frame</td>
                    <td><span className="text-amber-400 text-[10px]">Example Quote</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-zinc-100">4. Clean Finishing</td>
                    <td><Badge variant="outline" className="text-[10px] text-purple-300">FINISH</Badge></td>
                    <td>topaz/video-enhance-ai/upscale-1080p</td>
                    <td>upscale</td>
                    <td>$0.90 / run</td>
                    <td><span className="text-emerald-400 text-[10px]">Verified Catalog</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Profitability & Labor Summary */}
            <div className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px] block">Client Budget</span>
                <span className="font-bold text-zinc-100">${totalBudget.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Operator Labor (3.5h @ $65)</span>
                <span className="font-bold text-amber-300">${laborCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Est. Generation Spend</span>
                <span className="font-bold text-cyan-300">${actualGenSpend.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Projected Net Margin</span>
                <span className="font-bold text-emerald-400">{netMarginPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: AUTHORISE */}
      {activeStage === 'authorise' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                  Operator Authorization & Message Sealing
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">All external messages require human sign-off</span>
            </div>

            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{msg.subject}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        msg.status === 'operator_authorised' ? 'text-emerald-400 border-emerald-800' :
                        msg.status === 'dispatched' ? 'text-cyan-400 border-cyan-800' : 'text-amber-400 border-amber-800'
                      }`}>
                        {msg.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-zinc-500">Channel: {msg.channel}</span>
                  </div>

                  <p className="text-zinc-300 whitespace-pre-wrap font-sans text-xs bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                    {msg.body}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="text-zinc-500">
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
                          variant="default"
                          onClick={() => handleAuthoriseMessage(msg.id)}
                          loading={authorising}
                          className="h-7 text-xs font-mono bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                        >
                          <Shield className="h-3 w-3 mr-1" /> Authorise (Compute Seal)
                        </Button>
                      )}
                      {msg.status === 'operator_authorised' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDispatchMessage(msg.id)}
                          loading={dispatching === msg.id}
                          className="h-7 text-xs font-mono bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold"
                        >
                          <Send className="h-3 w-3 mr-1" /> Dispatch to {msg.channel}
                        </Button>
                      )}
                      {msg.status === 'dispatched' && (
                        <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
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

      {/* STAGE 4: PRODUCE */}
      {activeStage === 'produce' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                  Production Console & Atomic Spend Execution
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Atomic Reservations Active</span>
            </div>

            <div className="space-y-2">
              {generations.map(gen => (
                <div key={gen.id} className="p-3 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-zinc-200 block">Request ID: {gen.providerRequestId}</span>
                    <span className="text-zinc-500 text-[11px]">Model: {gen.model} | Type: {gen.outputType}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-900 text-[10px]">
                      {gen.status}
                    </Badge>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">
                      Actual Cost: ${(gen.actualCost || gen.costEstimate).toFixed(2)}
                    </span>
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
                <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                  QA-Assisted Defect Diagnostics & Repair
                </h3>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-900 text-xs font-mono">
                QA Assisted
              </Badge>
            </div>

            <p className="text-xs text-zinc-400">
              Defect detection pinpoints the smallest failed component and provides a quoted repair recommendation for operator sign-off before execution.
            </p>

            {repairRuns.map(run => (
              <div key={run.id} className="p-3 rounded border border-zinc-800 bg-zinc-950 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">
                    Failed Component: {run.qaResult.defectsDetected[0]?.component}
                  </span>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-800 text-[10px]">
                    {run.status}
                  </Badge>
                </div>
                <p className="text-zinc-400 font-sans text-xs">{run.actionDetails}</p>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-900">
                  <span className="text-zinc-500">Model: {run.targetModel}</span>
                  <span className="text-amber-400 font-bold">Quoted Cost: ${run.estimatedCostUSD.toFixed(2)} (Example Quote)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bounded Revision Feedback Interpreter */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                Subjective Feedback Interpreter (Warmer & More Hopeful)
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
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none font-mono"
              />
              <Button
                size="sm"
                onClick={handleInterpretRevision}
                loading={revisionInterpreting}
                className="shrink-0 text-xs font-mono bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Interpret
              </Button>
            </div>

            {revisionOptions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {revisionOptions.map((opt: any) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                      opt.recommended
                        ? 'border-emerald-800 bg-emerald-950/20 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">{opt.title}</span>
                      {opt.recommended && <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Recommended</Badge>}
                    </div>
                    <p className="text-[11px] font-sans text-zinc-300">{opt.description}</p>
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
                <h3 className="text-sm font-semibold font-mono text-zinc-100 uppercase tracking-wider">
                  Verified Deliverables & Server-Enforced Sign-off
                </h3>
              </div>
              <Badge variant="outline" className="text-red-400 border-red-900 text-xs font-mono">
                Strict Human Invariant
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 font-sans">
              Final delivery cannot be dispatched autonomously. The server endpoint strictly enforces operator signature verification.
            </p>

            <div className="space-y-2">
              {job.verifiedDeliverables?.map((deliv, idx) => (
                <div key={idx} className="p-3 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-zinc-200 block">{deliv.name}</span>
                    <span className="text-zinc-500 text-[11px]">{deliv.technicalSpecs}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-emerald-400 border-emerald-900 text-[10px]">
                      {deliv.verified ? 'Verified Master' : 'Pending Verification'}
                    </Badge>
                    {deliv.fileSizeBytes && (
                      <span className="block text-[10px] text-zinc-400 mt-0.5">
                        {(deliv.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="text-xs font-mono text-zinc-400">
                {job.approvalCheckpoints.finalDeliveryApproved ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Delivery Approved & Released by {job.approvalCheckpoints.finalDeliveryApprovedBy}
                  </span>
                ) : (
                  <span>Hold status: Awaiting human operator sign-off</span>
                )}
              </div>

              {!job.approvalCheckpoints.finalDeliveryApproved && (
                <Button
                  onClick={() => setDeliverySignOffOpen(true)}
                  className="text-xs font-mono bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Authorise Final Release
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY SIGN-OFF MODAL (SERVER-ENFORCED INVARIANT) */}
      {deliverySignOffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-4 text-zinc-100 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                Server-Enforced Final Delivery Sign-off
              </h3>
            </div>

            <p className="text-zinc-400 text-xs font-sans">
              You are certifying that all deliverables adhere to verified resolution, codec, and client brief requirements. Automated agents cannot perform this action.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">Human Operator Name</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Signature Token</label>
                <input
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
                <span className="text-zinc-300 text-[11px] font-sans">
                  I verify that the master 1080p MP4, vertical cuts, and photography stills have been inspected against the approved brief and client brand constraints.
                </span>
              </label>
            </div>

            {deliveryError && (
              <div className="rounded bg-red-950/40 border border-red-800 p-2 text-red-300 text-[11px]">
                {deliveryError}
              </div>
            )}

            {deliverySuccess && (
              <div className="rounded bg-emerald-950/40 border border-emerald-800 p-2 text-emerald-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Final release signed and delivered successfully.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setDeliverySignOffOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleFinalDeliverySignOff}
                loading={delivering}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold"
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
"""

os.makedirs('src/components/job-detail', exist_ok=True)
with open('src/components/job-detail/WorkflowStageWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(workspace_code)

print('Successfully created WorkflowStageWorkspace.tsx')
