'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AuditLogEntry, AuditEventType } from '@/types/autonomy';
import { ScrollText, RefreshCw, Filter, DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast, responseError } from '@/components/ui/toast';

interface AutonomyAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
}

export function AutonomyAuditLogModal({ isOpen, onClose, jobId }: AutonomyAuditLogModalProps) {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, jobId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = jobId ? `/api/autonomy/audit-logs?jobId=${jobId}` : '/api/autonomy/audit-logs';
      const res = await fetch(url);
      if (!res.ok) throw new Error(await responseError(res, 'Could not load audit ledger'));
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e: any) {
      toast.error(e.message || 'Could not load audit ledger');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = selectedEventType === 'all'
    ? logs
    : logs.filter(l => l.eventType === selectedEventType);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Studio Autonomy & Security Audit Ledger"
      description="Immutable ledger of autonomous model decisions, spend reservations, message seals, and human approvals."
      maxWidth="4xl"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={selectedEventType}
              onChange={e => setSelectedEventType(e.target.value)}
              className="rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All Events ({logs.length})</option>
              <option value="cost_reserved">Cost Reserved</option>
              <option value="cost_committed">Cost Committed</option>
              <option value="cost_released">Cost Released</option>
              <option value="message_draft">Message Drafts</option>
              <option value="message_authorised">Message Authorised</option>
              <option value="message_dispatched">Message Dispatched</option>
              <option value="self_repair_completed">Self-Repair Executed</option>
              <option value="delivery_signed_off">Delivery Signed Off</option>
              <option value="pause_escalation">Pause Escalations</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            loading={loading}
            className="h-7 text-xs border-zinc-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh Ledger
          </Button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No audit entries recorded for selected filter.
            </div>
          ) : (
            filteredLogs.map(entry => (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs uppercase ${
                        entry.actor === 'human_operator'
                          ? 'border-emerald-800 text-emerald-400 bg-emerald-950/20'
                          : entry.actor === 'client'
                          ? 'border-purple-800 text-purple-400 bg-purple-950/20'
                          : 'border-cyan-800 text-cyan-400 bg-cyan-950/20'
                      }`}
                    >
                      {entry.actorName || entry.actor}
                    </Badge>
                    <span className="font-bold text-zinc-200">{entry.summary}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(entry.timestamp).toLocaleTimeString()} · {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {entry.details}
                </p>

                {(entry.spendDeltaUSD !== undefined || entry.riskFlag) && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 text-xs">
                    {entry.spendDeltaUSD !== undefined && (
                      <span className="text-amber-400 font-semibold">
                        Spend Delta: ${entry.spendDeltaUSD.toFixed(2)}
                      </span>
                    )}
                    {entry.riskFlag && (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> {entry.riskFlag}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
