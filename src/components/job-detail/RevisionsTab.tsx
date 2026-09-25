'use client';

import React, { useState } from 'react';
import { Revision, Job, BriefAnalysis } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RotateCcw, Plus, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { useToast, responseError } from '../ui/toast';

interface RevisionsTabProps {
  job: Job;
  revisions?: Revision[];
  analysis?: BriefAnalysis | null;
  onRefresh: () => void;
}

export function RevisionsTab({ job, revisions = [], analysis, onRefresh }: RevisionsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientNote, setClientNote] = useState('');
  const [affectedDeliverable, setAffectedDeliverable] = useState(
    analysis?.deliverables[0]?.name || 'Hero Narrative Concept Teaser'
  );
  const [recommendedAction, setRecommendedAction] = useState('');
  const [incrementalCost, setIncrementalCost] = useState('2.50');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNote) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/jobs/${job.id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNote,
          affectedDeliverable,
          recommendedAction: recommendedAction || 'Adjust prompt parameters and re-render target clip.',
          expectedIncrementalCost: Number(incrementalCost) || 0,
        }),
      });

      if (!res.ok) throw new Error(await responseError(res, 'Could not log revision'));
      setClientNote('');
      setRecommendedAction('');
      setShowAddForm(false);
      toast.success('Revision logged. It needs your approval before any re-render.');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not log revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (revisionId: string, approvalStatus: 'Approved' | 'Declined') => {
    try {
      setActionLoading(revisionId);
      const res = await fetch(`/api/jobs/${job.id}/revisions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId, approvalStatus }),
      });

      if (!res.ok) throw new Error(await responseError(res, 'Could not update revision'));
      toast.success(`Revision ${approvalStatus.toLowerCase()}.`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not update revision');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            Client Revision Log & Scope Adjustments ({revisions.length})
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Any incremental GPU spend or workflow changes require explicit human operator approval before execution.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {showAddForm ? 'Cancel Form' : 'Log Client Revision Note'}
        </Button>
      </div>

      {/* New Revision Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-xs">
          <h5 className="font-semibold text-zinc-100 text-sm">Log Inbound Revision Request</h5>

          <div>
            <label className="block text-zinc-400 mb-1">Verbatim Client Feedback Note *</label>
            <textarea aria-label="Verbatim Client Feedback Note"
              required
              rows={3}
              value={clientNote}
              onChange={e => setClientNote(e.target.value)}
              placeholder="e.g. Can we warm up the lighting on the perfume flacon and extend the final hold by 2 seconds?"
              className="w-full rounded bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Affected Deliverable</label>
              <input aria-label="Affected Deliverable"
                type="text"
                value={affectedDeliverable}
                onChange={e => setAffectedDeliverable(e.target.value)}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Expected Incremental Cost ($ USD)</label>
              <input aria-label="Expected Incremental Cost ($ USD)"
                type="number"
                step="0.10"
                value={incrementalCost}
                onChange={e => setIncrementalCost(e.target.value)}
                className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Recommended Operator Action</label>
            <input aria-label="Recommended Operator Action"
              type="text"
              value={recommendedAction}
              onChange={e => setRecommendedAction(e.target.value)}
              placeholder="e.g. Re-run Higgsfield Cinematic Motion V3 step with updated lighting prompt seed."
              className="w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-zinc-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Submit Revision for Operator Review
            </Button>
          </div>
        </form>
      )}

      {/* Revision Cards */}
      {revisions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400">
          No revision notes logged for this job yet.
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {revisions.map(rev => {
            const isLoading = actionLoading === rev.id;

            return (
              <div
                key={rev.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rev.approvalStatus === 'Approved'
                          ? 'success'
                          : rev.approvalStatus === 'Declined'
                          ? 'destructive'
                          : 'warning'
                      }
                      className="text-xs"
                    >
                      {rev.approvalStatus}
                    </Badge>
                    <span className="text-zinc-400 text-xs">
                      Logged: {formatDateTime(rev.createdAt)}
                    </span>
                  </div>

                  <div className="text-zinc-300">
                    Est. Incremental Spend:{' '}
                    <strong className="text-amber-400">
                      {formatCurrency(rev.expectedIncrementalCost)}
                    </strong>
                  </div>
                </div>

                {/* Client Note */}
                <div className="rounded bg-zinc-900/60 border border-zinc-800/60 p-3 text-zinc-200 leading-relaxed italic">
                  "{rev.clientNote}"
                </div>

                {/* Technical Action & Deliverable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div>
                    <strong>Deliverable:</strong> <span className="text-zinc-300">{rev.affectedDeliverable}</span>
                  </div>
                  <div>
                    <strong>Action:</strong> <span className="text-cyan-300">{rev.recommendedAction}</span>
                  </div>
                </div>

                {/* Operator Human Approval Controls */}
                {rev.approvalStatus === 'Pending Human Approval' && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Human Sign-off required to commit spend
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(rev.id, 'Declined')}
                        loading={isLoading}
                        className="text-xs"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Decline Revision
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateStatus(rev.id, 'Approved')}
                        loading={isLoading}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve & Authorize Spend (+{formatCurrency(rev.expectedIncrementalCost)})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
