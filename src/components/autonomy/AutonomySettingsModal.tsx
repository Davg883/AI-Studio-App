'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AutonomySettings, MessageType, MessageDispatchPolicy } from '@/types/autonomy';
import { Shield, ShieldAlert, DollarSign, Sliders, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { useToast, responseError } from '@/components/ui/toast';
import { useOperatorName } from '@/lib/operator';

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
  const toast = useToast();
  const [operatorName] = useOperatorName();
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
      if (!res.ok) throw new Error(await responseError(res, 'Could not load autonomy settings'));
      const data = await res.json();
      setSettings(data.settings);
    } catch (err: any) {
      toast.error(err.message || 'Could not load autonomy settings');
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
        body: JSON.stringify({ updates: settings, updatedBy: operatorName }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Could not save autonomy settings'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Could not save autonomy settings');
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
        <div className="py-12 text-center text-xs text-zinc-400">
          Loading autonomy configuration...
        </div>
      ) : (
        <div className="space-y-6 pt-2 text-zinc-200">
          {/* Marketplace Safety Alert Banner */}
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3.5 text-xs flex items-start gap-3">
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
              <h3 className="text-sm font-semibold text-zinc-100">
                Spend Ceilings & Attempt Limits
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Spend Per Job ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">$</span>
                  <input aria-label="Max Spend Per Job ($)"
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
                <p className="text-xs text-zinc-400">Autonomous spend cap per job.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Spend Per Repair ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">$</span>
                  <input aria-label="Max Spend Per Repair ($)"
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
                <p className="text-xs text-zinc-400">Single repair iteration ceiling.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Total Account Ceiling ($)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">$</span>
                  <input aria-label="Total Account Ceiling ($)"
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
                <p className="text-xs text-zinc-400">Global studio spend cap.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 block">Max Retries Per Step</label>
                <input aria-label="Max Retries Per Step"
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
                <p className="text-xs text-zinc-400">Stop retry on step limit.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Allowed Model Families */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
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
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
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
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-zinc-400">{model.role}</div>
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
                <h3 className="text-sm font-semibold text-zinc-100">
                  Client Communication Dispatch Policy
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Direct / Approved Channels Only
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60 text-xs">
              {(Object.keys(MESSAGE_TYPE_LABELS) as MessageType[]).map(typeKey => {
                const info = MESSAGE_TYPE_LABELS[typeKey];
                const policy = settings.dispatchPolicy[typeKey] || 'draft_for_approval';
                const isFinalDelivery = typeKey === 'final_delivery';

                return (
                  <div key={typeKey} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-zinc-200">{info.label}</div>
                      <div className="text-xs text-zinc-400 font-sans">{info.desc}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFinalDelivery ? (
                        <span className="rounded bg-red-950/60 border border-red-800 px-2 py-1 text-xs text-red-300 font-mono">
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
              <h3 className="text-sm font-semibold text-red-200">
                Mandatory Human Pause Conditions (Strict Escalation)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              When any of these conditions are detected, Studio Operator automatically pauses execution and dispatches an escalation alert.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
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
                    <div className="text-xs text-zinc-400 font-sans">{cond.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
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
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                className="font-bold"
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
