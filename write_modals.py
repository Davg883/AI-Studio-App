import os

# 1. AutonomySettingsModal.tsx
settings_code = """'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AutonomySettings, MessageType, MessageDispatchPolicy } from '@/types/autonomy';
import { Shield, ShieldAlert, DollarSign, Sliders, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

interface AutonomySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const MESSAGE_TYPE_LABELS: Record<MessageType, { label: string; desc: string }> = {
  intake_question: {
    label: 'Intake Questions',
    desc: 'Clarifications on missing requirements, assets, or constraints',
  },
  asset_request: {
    label: 'Asset Requests',
    desc: 'Requests for logos, product packs, brand guides, consent documents',
  },
  scope_proposal: {
    label: 'Scope Proposals',
    desc: 'Plain-English scope, deliverables, timeline, price, exclusions',
  },
  milestone_update: {
    label: 'Milestone Updates',
    desc: 'Progress updates on key workflow step completions',
  },
  concept_presentation: {
    label: 'Concept Presentations',
    desc: 'Sharing initial hooks, storyboard stills, or mood variants',
  },
  revision_interpretation: {
    label: 'Revision Interpretations',
    desc: 'Classification of client notes into included tweaks vs scope changes',
  },
  change_order: {
    label: 'Change Orders',
    desc: 'Proposals for out-of-scope revisions with price & timeline deltas',
  },
  final_delivery: {
    label: 'Final Delivery Package',
    desc: 'Master files, formats, license notes (Server-enforced invariant: strictly human sign-off)',
  },
  retention_followup: {
    label: 'Post-Delivery Retention',
    desc: 'Follow-up message proposing seasonal packs or UGC iterations',
  },
};

const ALL_MODEL_FAMILIES = [
  { id: 'Seedream', name: 'Seedream (ByteDance 4.0)', role: 'Search / Control Stills' },
  { id: 'Seedance', name: 'Seedance (ByteDance 2.5)', role: 'Control / Ship Video' },
  { id: 'Soul', name: 'Soul (Higgsfield 2.0)', role: 'Character / Expressive Video' },
  { id: 'Qwen', name: 'Qwen (Image Edit 2.0)', role: 'Targeted Inpainting & Repair' },
  { id: 'Wan', name: 'Wan (2.6 Text/Image Video)', role: 'Fast Cinematic Concepts' },
  { id: 'Topaz', name: 'Topaz / Seedance Upscale', role: 'Finish & Clean High-Res' },
  { id: 'ElevenLabs', name: 'ElevenLabs / F5-TTS', role: 'Voiceover & Audio Synthesis' },
];

export function AutonomySettingsModal({ isOpen, onClose, onSaved }: AutonomySettingsModalProps) {
  const [settings, setSettings] = useState<AutonomySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/autonomy/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load autonomy settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetch('/api/autonomy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        if (onSaved) onSaved();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agency Autonomy Policy & Safety Controls"
      description="Configure spend ceilings, autonomous repair thresholds, dispatch policies, and mandatory human pause conditions."
      maxWidth="4xl"
    >
      {loading || !settings ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-500">
          Loading autonomy configuration...
        </div>
      ) : (
        <div className="space-y-6 pt-2 text-zinc-200">
          {/* Marketplace Safety Alert Banner */}
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3.5 text-xs font-mono flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300">Third-Party Marketplace Invariant:</span>
              <p className="text-zinc-300 mt-0.5">
                Studio Operator will <strong>never</strong> auto-scrape, auto-bid, auto-message, or auto-deliver to third-party marketplaces (Upwork, Fiverr, Contra). For those channels, messages and proposals are strictly drafted for human review.
              </p>
            </div>
          </div>

          {/* Section 1: Spend Ceilings & Generation Attempt Limits */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
                Spend Ceilings & Attempt Limits
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Spend Per Job ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">$</span>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="500"
                    value={settings.maxAutoSpendPerJob}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        maxAutoSpendPerJob: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">Autonomous spend cap per job.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Spend Per Repair ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">$</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={settings.maxAutoSpendPerRepair}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        maxAutoSpendPerRepair: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">Single repair iteration ceiling.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Total Account Ceiling ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">$</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    max="10000"
                    value={settings.totalAccountSpendLimitUSD || 1000}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        totalAccountSpendLimitUSD: parseFloat(e.target.value) || 1000,
                      })
                    }
                    className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">Global studio spend cap.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Retries Per Step</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={settings.maxGenerationAttemptsPerStep}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      maxGenerationAttemptsPerStep: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-zinc-500">Stop retry on step limit.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Allowed Model Families */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
                Allowed Model Families in Production
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ALL_MODEL_FAMILIES.map(model => {
                const isChecked = settings.allowedModelFamilies.includes(model.id);
                return (
                  <label
                    key={model.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded border transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-cyan-800/80 bg-cyan-950/20 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...settings.allowedModelFamilies, model.id]
                          : settings.allowedModelFamilies.filter(id => id !== model.id);
                        setSettings({ ...settings, allowedModelFamilies: next });
                      }}
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                    />
                    <div className="text-xs">
                      <div className="font-mono font-medium">{model.name}</div>
                      <div className="text-[10px] text-zinc-400">{model.role}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Dispatch Policy By Message Type */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-100 font-mono">
                  Client Communication Dispatch Policy
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Direct / Approved Channels Only
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60 text-xs font-mono">
              {(Object.keys(MESSAGE_TYPE_LABELS) as MessageType[]).map(typeKey => {
                const info = MESSAGE_TYPE_LABELS[typeKey];
                const policy = settings.dispatchPolicy[typeKey] || 'draft_for_approval';
                const isFinalDelivery = typeKey === 'final_delivery';

                return (
                  <div key={typeKey} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-zinc-200">{info.label}</div>
                      <div className="text-[11px] text-zinc-400 font-sans">{info.desc}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFinalDelivery ? (
                        <span className="rounded bg-red-950/60 border border-red-800 px-2 py-1 text-[11px] text-red-300 font-mono">
                          Always Draft (Server Invariant)
                        </span>
                      ) : (
                        <select
                          value={policy}
                          onChange={e => {
                            setSettings({
                              ...settings,
                              dispatchPolicy: {
                                ...settings.dispatchPolicy,
                                [typeKey]: e.target.value as MessageDispatchPolicy,
                              },
                            });
                          }}
                          className="rounded bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="draft_for_approval">Draft for Human Approval</option>
                          <option value="auto_send">Auto-Send (Direct Portals)</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Mandatory Pause Conditions */}
          <div className="rounded-lg border border-red-900/40 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-200 font-mono">
                Mandatory Human Pause Conditions (Strict Escalation)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              When any of these conditions are detected, Studio Operator automatically pauses execution and dispatches an escalation alert.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {[
                {
                  key: 'likenessOrVoice' as const,
                  title: 'Real / Synthetic Person Likeness or Voice',
                  desc: 'Requires explicit written release and usage consent.',
                },
                {
                  key: 'unclearAssetOwnership' as const,
                  title: 'Unclear Asset Ownership / Third-Party IP',
                  desc: 'Uncertain brand rights, character copyright, or stock licenses.',
                },
                {
                  key: 'factualAdvertisingClaims' as const,
                  title: 'Factual Advertising / Health / Efficacy Claims',
                  desc: 'Requires legal clearance before publishing commercial copy.',
                },
                {
                  key: 'exactPackagingRegulatedCopy' as const,
                  title: 'Regulated Packaging, Warnings, Exact Ingredients',
                  desc: 'Zero tolerance for hallucinated nutrition or safety labels.',
                },
                {
                  key: 'negativeExpectedMargin' as const,
                  title: 'Negative or Below-Target Gross Margin',
                  desc: 'Production spend exceeds profitable economics ratio.',
                },
                {
                  key: 'missedDeadlineRisk' as const,
                  title: 'Missed Delivery Window Risk (>75% time elapsed)',
                  desc: 'Approaching SLA cutoff without final render completion.',
                },
                {
                  key: 'clientDispute' as const,
                  title: 'Client Scope Dispute / Contention',
                  desc: 'Client rejects concept or questions proposal terms.',
                },
              ].map(cond => (
                <label
                  key={cond.key}
                  className="flex items-start gap-2.5 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={settings.mandatoryPauseConditions[cond.key]}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        mandatoryPauseConditions: {
                          ...settings.mandatoryPauseConditions,
                          [cond.key]: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-zinc-200">{cond.title}</div>
                    <div className="text-[11px] text-zinc-400 font-sans">{cond.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="text-xs font-mono text-zinc-500">
              Policy updated: {new Date(settings.updatedAt).toLocaleString()} by {settings.updatedBy}
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Policy saved successfully
                </span>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                loading={saving}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold font-mono"
              >
                Save Autonomy Policy
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
"""

# 2. AutonomyAuditLogModal.tsx
audit_log_code = """'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AuditLogEntry, AuditEventType } from '@/types/autonomy';
import { ScrollText, RefreshCw, Filter, DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AutonomyAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
}

export function AutonomyAuditLogModal({ isOpen, onClose, jobId }: AutonomyAuditLogModalProps) {
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
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
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
          <div className="flex items-center gap-2 text-xs font-mono">
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
            className="h-7 text-xs font-mono border-zinc-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh Ledger
          </Button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500">
              No audit entries recorded for selected filter.
            </div>
          ) : (
            filteredLogs.map(entry => (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-mono ${
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
                  <span className="text-[10px] text-zinc-500">
                    {new Date(entry.timestamp).toLocaleTimeString()} · {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {entry.details}
                </p>

                {(entry.spendDeltaUSD !== undefined || entry.riskFlag) && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50 text-[10px]">
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
          <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
"""

# 3. ClientMemoryModal.tsx
memory_modal_code = """'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ClientMemory } from '@/types/autonomy';
import { Shield, Lock, Palette, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClientMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function ClientMemoryModal({ isOpen, onClose, clientId }: ClientMemoryModalProps) {
  const [memory, setMemory] = useState<ClientMemory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchMemory();
    }
  }, [isOpen, clientId]);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/memory`);
      const data = await res.json();
      if (data.success && data.memory) {
        setMemory(data.memory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memory ? `${memory.brandName} — Client Knowledge Vault` : 'Client Memory Vault'}
      description="Account-level brand assets, approved product claims, winning aesthetics, and likeness consent firewall."
      maxWidth="4xl"
    >
      {loading || !memory ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-500">
          Loading client memory vault...
        </div>
      ) : (
        <div className="space-y-5 pt-2 text-xs font-mono text-zinc-200">
          {/* Hard Consent Firewall Banner */}
          <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-3.5 flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block uppercase text-[11px]">Hard Privacy & Rights Firewall</span>
              <p className="text-zinc-300 font-sans text-xs mt-0.5">
                {memory.consentFirewall.consentScopeNotice}
              </p>
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-zinc-400">Authorized Individuals:</span>
                {memory.consentFirewall.authorizedPersons.map((p, idx) => (
                  <Badge key={idx} variant="outline" className="border-red-800 text-red-300 text-[10px]">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Approved Brand Assets (Colors, Fonts, Logos) */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Palette className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase text-zinc-100">Approved Brand Identity</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Brand Colors */}
              <div className="space-y-2">
                <span className="text-zinc-500 text-[10px] uppercase block">Brand Color Palette</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.brandColors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-zinc-950 border border-zinc-800">
                      <div className="h-4 w-4 rounded-full border border-zinc-700" style={{ backgroundColor: color.hex }} />
                      <div className="text-[11px]">
                        <span className="font-semibold text-zinc-200 block">{color.name}</span>
                        <span className="text-zinc-500">{color.hex} ({color.role})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-2">
                <span className="text-zinc-500 text-[10px] uppercase block">Typography Stack</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.fonts.map((f, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-zinc-950 border border-zinc-800">
                      <span className="font-semibold text-zinc-200 block text-[11px]">{f.name}</span>
                      <span className="text-zinc-500 text-[10px] capitalize">{f.category} Typography</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logos */}
              <div className="space-y-2">
                <span className="text-zinc-500 text-[10px] uppercase block">Vector Logos & Marks</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.logos.map((logo, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-200 block text-[11px] truncate max-w-[140px]">{logo.name}</span>
                        <span className="text-zinc-500 text-[10px]">{logo.format}</span>
                      </div>
                      {logo.isPrimary && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Approved Products & Forbidden Claims */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-zinc-100 border-b border-zinc-800 pb-2">
              Approved Products & Regulated Claims
            </h4>

            <div className="space-y-2.5">
              {memory.productDetails.map((prod, idx) => (
                <div key={idx} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-zinc-100 block text-[11px]">{prod.name}</span>
                  <p className="text-[11px] text-zinc-400 font-sans">{prod.description}</p>
                  {prod.forbiddenClaims && prod.forbiddenClaims.length > 0 && (
                    <div className="pt-1 text-[10px] text-red-300">
                      <span className="font-bold">Forbidden Claims:</span> {prod.forbiddenClaims.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Creative History & Aesthetics */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-100 border-b border-zinc-800 pb-2">
              Creative History & Styling
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-emerald-400 text-[10px] font-bold block mb-1">Winning Aesthetics:</span>
                <ul className="list-disc list-inside text-zinc-300 text-[11px] space-y-0.5">
                  {memory.creativeHistory.winningStyles.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-red-400 text-[10px] font-bold block mb-1">Rejected Aesthetics:</span>
                <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5">
                  {memory.creativeHistory.rejectedStyles.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
"""

os.makedirs('src/components/autonomy', exist_ok=True)
os.makedirs('src/components/job-detail', exist_ok=True)

with open('src/components/autonomy/AutonomySettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(settings_code)
print('Wrote AutonomySettingsModal.tsx')

with open('src/components/autonomy/AutonomyAuditLogModal.tsx', 'w', encoding='utf-8') as f:
    f.write(audit_log_code)
print('Wrote AutonomyAuditLogModal.tsx')

with open('src/components/job-detail/ClientMemoryModal.tsx', 'w', encoding='utf-8') as f:
    f.write(memory_modal_code)
print('Wrote ClientMemoryModal.tsx')
