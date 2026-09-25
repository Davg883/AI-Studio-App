'use client';

import React, { useState, useEffect } from 'react';
import { StructuredBriefAnalysis, Job } from '@/types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  GitCompare,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useOperatorName } from '@/lib/operator';

interface ReviewAnalysisScreenProps {
  job: Job;
  originalAnalysis?: StructuredBriefAnalysis | null;
  currentEditedAnalysis?: StructuredBriefAnalysis | null;
  onRefresh: () => void;
  onClose?: () => void;
}

export function ReviewAnalysisScreen({
  job,
  originalAnalysis,
  currentEditedAnalysis,
  onRefresh,
  onClose,
}: ReviewAnalysisScreenProps) {
  const [operatorName] = useOperatorName();
  const [edited, setEdited] = useState<StructuredBriefAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'comparison'>('editor');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentEditedAnalysis) {
      setEdited(JSON.parse(JSON.stringify(currentEditedAnalysis)));
    } else if (originalAnalysis) {
      setEdited(JSON.parse(JSON.stringify(originalAnalysis)));
    }
  }, [currentEditedAnalysis, originalAnalysis]);

  if (!edited || !originalAnalysis) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center text-xs text-zinc-400">
        No brief analysis record available to review. Run GPT-6 Astra analysis first.
      </div>
    );
  }

  const handleSave = async (action: 'save_draft' | 'approve' | 'reject') => {
    try {
      setSavingAction(action);
      setFeedbackMsg(null);

      const res = await fetch(`/api/jobs/${job.id}/review-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedAnalysis: edited,
          action,
          operatorNotes,
          operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save analysis review');
      }

      setFeedbackMsg({
        type: 'success',
        text:
          action === 'approve'
            ? 'Job successfully approved with human adjustments!'
            : action === 'reject'
            ? 'Job marked as Rejected.'
            : 'Human-edited analysis saved as draft.',
      });

      onRefresh();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSavingAction(null);
    }
  };

  // Helper to add deliverable
  const addDeliverable = () => {
    const updated = { ...edited };
    updated.deliverables.push({
      name: 'New Custom Deliverable',
      type: 'Cutdown',
      format: 'MP4 H.265',
      aspectRatio: '16:9',
      durationSeconds: 15,
      resolution: '3840x2160',
      exactTextRequirements: [],
      description: 'Human specified deliverable requirement.',
    });
    setEdited(updated);
  };

  const removeDeliverable = (index: number) => {
    const updated = { ...edited };
    updated.deliverables.splice(index, 1);
    setEdited(updated);
  };

  // Helper to add rights flag
  const addRightsFlag = () => {
    const updated = { ...edited };
    updated.rightsAndConsentFlags.push({
      flag: 'Operator Flag: Specific Asset Review',
      severity: 'medium',
      details: 'Check authorization and origin before generating.',
    });
    setEdited(updated);
  };

  const removeRightsFlag = (index: number) => {
    const updated = { ...edited };
    updated.rightsAndConsentFlags.splice(index, 1);
    setEdited(updated);
  };

  const isFieldModified = (key: keyof StructuredBriefAnalysis): boolean => {
    if (!originalAnalysis || !edited) return false;
    return JSON.stringify(originalAnalysis[key]) !== JSON.stringify(edited[key]);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-6">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-400" />
              Human Review & Analysis Editor
            </h3>
            {edited.isHumanEdited && (
              <Badge variant="warning" className="text-xs">
                Operator Modified
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review GPT-6 Astra extractions, adjust parameters, compare diffs, and authorize job status.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'editor'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Field Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'comparison'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitCompare className="h-3 w-3" />
              Comparison Diff
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border border-red-800 text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* VIEW MODE 1: Comparison Diff */}
      {viewMode === 'comparison' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original AI Output */}
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Original Astra AI Output
                </span>
                <span className="text-xs text-zinc-400">{originalAnalysis.modelUsed}</span>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">Job Type:</span>
                <div className="text-zinc-200 mt-0.5">{originalAnalysis.jobType}</div>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">Concise Summary:</span>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">{originalAnalysis.conciseSummary}</p>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">
                  Deliverables ({originalAnalysis.deliverables.length}):
                </span>
                <ul className="mt-1 space-y-1 text-zinc-300 list-disc list-inside">
                  {originalAnalysis.deliverables.map((d, i) => (
                    <li key={i}>
                      {d.name} ({d.aspectRatio}, {d.durationSeconds}s, {d.resolution})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">
                  Rights Flags ({originalAnalysis.rightsAndConsentFlags.length}):
                </span>
                <div className="mt-1 space-y-1">
                  {originalAnalysis.rightsAndConsentFlags.map((f, i) => (
                    <div key={i} className="text-zinc-400 text-xs">
                      • [{f.severity}] {f.flag}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">Astra Decision:</span>
                <div className="text-amber-300 font-bold mt-0.5">{originalAnalysis.decision.toUpperCase()}</div>
              </div>
            </div>

            {/* Human Edited Version */}
            <div className="rounded border border-amber-800/40 bg-zinc-900/60 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                  Operator Human-Reviewed Version
                </span>
                <span className="text-xs text-amber-400/80">Active Configuration</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs uppercase">Job Type:</span>
                  {isFieldModified('jobType') && <Badge variant="warning" className="text-xs">Modified</Badge>}
                </div>
                <div className="text-zinc-100 font-semibold mt-0.5">{edited.jobType}</div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs uppercase">Concise Summary:</span>
                  {isFieldModified('conciseSummary') && <Badge variant="warning" className="text-xs">Modified</Badge>}
                </div>
                <p className="text-zinc-200 mt-0.5 leading-relaxed">{edited.conciseSummary}</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs uppercase">
                    Deliverables ({edited.deliverables.length}):
                  </span>
                  {isFieldModified('deliverables') && <Badge variant="warning" className="text-xs">Modified</Badge>}
                </div>
                <ul className="mt-1 space-y-1 text-zinc-200 list-disc list-inside">
                  {edited.deliverables.map((d, i) => (
                    <li key={i}>
                      {d.name} ({d.aspectRatio}, {d.durationSeconds}s, {d.resolution})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs uppercase">
                    Rights Flags ({edited.rightsAndConsentFlags.length}):
                  </span>
                  {isFieldModified('rightsAndConsentFlags') && <Badge variant="warning" className="text-xs">Modified</Badge>}
                </div>
                <div className="mt-1 space-y-1">
                  {edited.rightsAndConsentFlags.map((f, i) => (
                    <div key={i} className="text-zinc-300 text-xs">
                      • [{f.severity}] {f.flag}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase">Deterministic Review Decision:</span>
                <div className="text-emerald-400 font-bold mt-0.5">{edited.decision.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: Field Editor */
        <div className="space-y-5 text-xs">
          {/* Job Type & Concise Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">
                Standardized Job Type
                {isFieldModified('jobType') && <span className="ml-1 text-amber-400">• modified</span>}
              </label>
              <input aria-label="Standardized Job Type"
                type="text"
                value={edited.jobType}
                onChange={e => setEdited({ ...edited, jobType: e.target.value })}
                className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">
                Executive Concise Summary
                {isFieldModified('conciseSummary') && <span className="ml-1 text-amber-400">• modified</span>}
              </label>
              <input aria-label="Executive Concise Summary"
                type="text"
                value={edited.conciseSummary}
                onChange={e => setEdited({ ...edited, conciseSummary: e.target.value })}
                className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Deliverables Section with Add/Remove */}
          <div className="rounded border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 uppercase tracking-wider text-xs">
                Deliverable Requirements ({edited.deliverables.length})
                {isFieldModified('deliverables') && <span className="ml-1 text-amber-400 font-normal">• modified</span>}
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={addDeliverable} className="text-xs h-7">
                <Plus className="h-3 w-3 mr-1" /> Add Deliverable
              </Button>
            </div>

            <div className="space-y-3">
              {edited.deliverables.map((del, idx) => (
                <div key={idx} className="rounded border border-zinc-800/80 bg-zinc-950 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-200 text-xs">Deliverable #{idx + 1}</span>
                    {edited.deliverables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeliverable(idx)}
                        className="text-zinc-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-400">Name</label>
                      <input aria-label="Name"
                        type="text"
                        value={del.name}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.deliverables[idx].name = e.target.value;
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Aspect Ratio</label>
                      <input aria-label="Aspect Ratio"
                        type="text"
                        value={del.aspectRatio}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.deliverables[idx].aspectRatio = e.target.value;
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Duration (seconds)</label>
                      <input aria-label="Duration (seconds)"
                        type="number"
                        min="0"
                        value={del.durationSeconds}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.deliverables[idx].durationSeconds = Number(e.target.value);
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rights & Consent Flags with Add/Remove */}
          <div className="rounded border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                Rights, Likeness & Consent Flags ({edited.rightsAndConsentFlags.length})
                {isFieldModified('rightsAndConsentFlags') && <span className="ml-1 text-amber-400 font-normal">• modified</span>}
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={addRightsFlag} className="text-xs h-7">
                <Plus className="h-3 w-3 mr-1" /> Add Rights Flag
              </Button>
            </div>

            <div className="space-y-2">
              {edited.rightsAndConsentFlags.map((flag, idx) => (
                <div key={idx} className="rounded border border-zinc-800/80 bg-zinc-950 p-2.5 flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={flag.flag}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.rightsAndConsentFlags[idx].flag = e.target.value;
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      />
                    </div>
                    <div>
                      <select
                        value={flag.severity}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.rightsAndConsentFlags[idx].severity = e.target.value as any;
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      >
                        <option value="low">Low Severity</option>
                        <option value="medium">Medium Severity</option>
                        <option value="high">High Severity</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Details & mitigation..."
                        value={flag.details}
                        onChange={e => {
                          const updated = { ...edited };
                          updated.rightsAndConsentFlags[idx].details = e.target.value;
                          setEdited(updated);
                        }}
                        className="w-full rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-400"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRightsFlag(idx)}
                    className="text-zinc-400 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Assets & Brand Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">Missing Assets (one per line)</label>
              <textarea aria-label="Missing Assets (one per line)"
                rows={3}
                value={edited.missingAssets.join('\n')}
                onChange={e => setEdited({ ...edited, missingAssets: e.target.value.split('\n').filter(Boolean) })}
                className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Brand Constraints (one per line)</label>
              <textarea aria-label="Brand Constraints (one per line)"
                rows={3}
                value={edited.brandConstraints.join('\n')}
                onChange={e => setEdited({ ...edited, brandConstraints: e.target.value.split('\n').filter(Boolean) })}
                className="w-full rounded bg-zinc-900 border border-zinc-800 p-2 text-zinc-200"
              />
            </div>
          </div>

          {/* Operator Sign-off Notes */}
          <div>
            <label className="block text-zinc-400 mb-1">Human Operator Review Rationale / Notes</label>
            <input aria-label="Human Operator Review Rationale / Notes"
              type="text"
              placeholder="e.g. Cleared soundalike audio by switching to synthetic ambient score. Budget ceiling locked."
              value={operatorNotes}
              onChange={e => setOperatorNotes(e.target.value)}
              className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-zinc-400">
          Original Astra baseline preserved in database for full audit trail.
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Save Draft */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave('save_draft')}
            loading={savingAction === 'save_draft'}
            className="text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            Save Draft Edits
          </Button>

          {/* Reject Job */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => handleSave('reject')}
            loading={savingAction === 'reject'}
            className="text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reject Job
          </Button>

          {/* Approve Job */}
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => handleSave('approve')}
            loading={savingAction === 'approve'}
            className="text-xs font-semibold"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approve Job & Authorize Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
