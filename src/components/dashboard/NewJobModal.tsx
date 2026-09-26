'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { JobSource } from '@/types';
import { SOURCE_DEFAULT_FEES } from '@/lib/constants';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { formatMoney, ClientCurrency } from '@/lib/money';
import { useStudioConfig } from '@/lib/use-studio-config';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const SAMPLE_BRIEFS = [
  {
    label: 'Luxury Concept Film (Upwork)',
    title: 'Aethelgard: The Obsidian Horizon Concept Film',
    clientName: 'Maison de L’Ombre',
    source: 'Upwork' as JobSource,
    budget: 4200,
    brief: `Client brief pasted from Upwork:
Looking for a visionary AI Director / Studio to craft a 45-second cinematic concept teaser film for our flagship luxury fragrance launch: "Aethelgard: The Obsidian Horizon".

Visual Direction & World-building:
- High-concept brutalist sci-fi meets Scandinavian volcanic landscapes (black sand deserts, basal crystalline pillars, cold aurora borealis skies).
- Monolithic obsidian flacon rising from liquid glass. Macro droplets refracting iridescent light.
- Mood reference: Denis Villeneuve (Dune / Blade Runner 2049), ARRI Alexa 65 anamorphic widescreen feel.
- Deliverables needed:
  1) 45s Hero Teaser in 4K ProRes (16:9).
  2) 15s Vertical Cutdown (9:16) for Instagram Reels and digital ad buy.
  3) Master Keyframe prints for billboard concept art.
- Audio: Atmospheric sub-bass pulse, tactile glass whispers, and deep British narrative voiceover delivering our core manifesto: "From the ash of stillness, presence is born."
- Fixed contract budget: $4,200. Need initial preview in 7 days, final delivery in 14 days.`,
    clientNotes: 'Client emphasized no generic CGI look; must have photorealistic physical lighting and micro camera shake.',
  },
  {
    label: 'Fast Social Motion Spot (Contra)',
    title: 'CrispVolt: 15s Kinetic Electrolyte Energy Loop',
    clientName: 'Volt Labs Nutrition',
    source: 'Contra' as JobSource,
    budget: 950,
    brief: `Client brief pasted from Contra message:
We need a viral, hyper-kinetic 15-second 9:16 vertical motion spot for our new CrispVolt sparkling electrolyte drink (Yuzu Citrus flavor).
- Fast rhythmic pacing: can drops into icy citrus splash, electric micro-bubbles, bold neon yellow typography flashing "SURGE RECHARGE".
- Audio needs soundalike rhythm of Daft Punk / The Weeknd fast synthwave drums.
- Client budget: $950.
- Timeline: 4 days turnaround.`,
    clientNotes: 'Client wants quick turnaround, but mentioned copyrighted music style and hasn’t uploaded their official logo vector.',
  },
  {
    label: 'Direct Lead Product Teaser',
    title: 'Apex Kinetic: Zero-G Running Shoe Teaser',
    clientName: 'Strata Performance Gear',
    source: 'Direct Lead' as JobSource,
    budget: 2800,
    brief: `Raw inbound client email:
Hi David,
We are launching our revolutionary carbon-plate trail runner, the "Apex Strata-1". We need a 30s teaser that visualizes anti-gravity stride mechanics.
- Shots: Macro foot strike on lunar volcanic gravel, soles bending with visible carbon rebound lattice, runner sprinting through misty mountain ridge at dawn.
- Deliverables: 30s Master (16:9 4K) + 15s Cut (9:16).
- Direct budget: $2,800.
- Delivery deadline: In 2 weeks.`,
    clientNotes: 'Direct corporate inquiry via portfolio contact form. Zero marketplace fees.',
  },
];

export function NewJobModal({ isOpen, onClose, onCreated }: NewJobModalProps) {
  const router = useRouter();
  const config = useStudioConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingJobId, setExistingJobId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [source, setSource] = useState<JobSource>('Upwork');
  const [channelFeePct, setChannelFeePct] = useState(String(SOURCE_DEFAULT_FEES['Upwork'] ?? 0));
  const [budget, setBudget] = useState('2500');
  const [currency, setCurrency] = useState<ClientCurrency>('GBP');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [rawBrief, setRawBrief] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [refUrl, setRefUrl] = useState('');

  // Picking a source resets the fee to that channel's default; the operator can still override it
  const changeSource = (next: JobSource) => {
    setSource(next);
    setChannelFeePct(String(SOURCE_DEFAULT_FEES[next] ?? 0));
  };

  const budgetNum = Number(budget) || 0;
  const feePctNum = Math.min(100, Math.max(0, Number(channelFeePct) || 0));
  const feeAmount = (budgetNum * feePctNum) / 100;

  const loadSample = (sample: typeof SAMPLE_BRIEFS[0]) => {
    setTitle(sample.title);
    setClientName(sample.clientName);
    changeSource(sample.source);
    setBudget(sample.budget.toString());
    setRawBrief(sample.brief);
    setClientNotes(sample.clientNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawBrief) {
      setError('Job title and raw brief are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setExistingJobId(null);

      const refAssets = refUrl
        ? [
            {
              id: `ref-${Date.now()}`,
              name: 'Reference Link / Moodboard',
              url: refUrl,
              type: 'image' as const,
              notes: 'Client attached moodboard reference',
            },
          ]
        : [];

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          clientName: clientName || 'Anonymous Client',
          source,
          channelFeePct: feePctNum,
          currency,
          rawBrief,
          budget: budgetNum,
          deadline: new Date(deadline).toISOString(),
          clientNotes,
          referenceAssets: refAssets,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409 && data.existingJobId) setExistingJobId(data.existingJobId);
        throw new Error(data.error || 'Failed to create job');
      }

      onClose();
      if (onCreated) onCreated();
      router.push(`/jobs/${data.job.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating job');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500';
  const labelClass = 'block text-xs text-zinc-400 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New job"
      description="Paste a brief from Upwork, Fiverr, Contra, email or a direct lead."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Safety policy: one line, details on demand */}
        <details className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
          <summary className="cursor-pointer select-none flex items-center gap-2 list-none">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            Marketplace guardrails on: nothing is sent to a marketplace without you.
            <span className="ml-auto text-zinc-400 underline">Details</span>
          </summary>
          <p className="mt-2 text-zinc-400 leading-relaxed">
            The studio never scrapes, submits proposals, accepts contracts, messages clients, or delivers work on
            third-party marketplaces. All external marketplace actions stay manual.
          </p>
        </details>

        {/* Sample briefs are demo tooling: only offered in mock mode */}
        {config?.mockMode && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-zinc-400" />
              Sample briefs:
            </span>
            {SAMPLE_BRIEFS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(s)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded bg-red-950/40 border border-red-800/50 p-2.5 text-xs text-red-300 flex items-center justify-between gap-3"
          >
            <span>{error}</span>
            {existingJobId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/jobs/${existingJobId}`);
                }}
                className="shrink-0 underline text-red-200 hover:text-white"
              >
                Open existing job
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-title" className={labelClass}>
              Project title *
            </label>
            <input
              id="job-title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Aethelgard: The Obsidian Horizon"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="job-client" className={labelClass}>
              Client / lead name
            </label>
            <input
              id="job-client"
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Maison de L'Ombre"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="job-source" className={labelClass}>
              Source
            </label>
            <select
              id="job-source"
              value={source}
              onChange={e => changeSource(e.target.value as JobSource)}
              className={inputClass}
            >
              <option value="Upwork">Upwork</option>
              <option value="Fiverr">Fiverr</option>
              <option value="Contra">Contra</option>
              <option value="Email">Email</option>
              <option value="Direct Lead">Direct lead</option>
            </select>
          </div>

          <div>
            <label htmlFor="job-fee" className={labelClass}>
              Channel fee (%)
            </label>
            <input
              id="job-fee"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={channelFeePct}
              onChange={e => setChannelFeePct(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label htmlFor="job-budget" className={labelClass}>
              Client price *
            </label>
            <div className="flex gap-1">
              <select
                aria-label="Quotation currency"
                value={currency}
                onChange={e => setCurrency(e.target.value as ClientCurrency)}
                className="rounded bg-zinc-900 border border-zinc-800 px-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="GBP">£ GBP</option>
                <option value="USD">$ USD</option>
              </select>
              <input
                id="job-budget"
                type="number"
                min="0"
                required
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-deadline" className={labelClass}>
              Deadline *
            </label>
            <input
              id="job-deadline"
              type="date"
              required
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        {/* Early economics preview: production costs are added once the workflow is planned */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
          <span>
            Channel fee: <span className="font-mono text-zinc-200">{formatMoney(feeAmount, currency)}</span>
          </span>
          <span>
            You keep before production:{' '}
            <span className="font-mono text-emerald-300">{formatMoney(budgetNum - feeAmount, currency)}</span>
          </span>
          <span>Provider costs (billed in USD) and labour are added after planning.</span>
        </div>

        <div>
          <label htmlFor="job-brief" className={labelClass}>
            Raw brief (pasted text) *
          </label>
          <textarea
            id="job-brief"
            required
            rows={6}
            value={rawBrief}
            onChange={e => setRawBrief(e.target.value)}
            placeholder="Paste the full job posting or message verbatim..."
            className={`${inputClass} text-xs font-mono leading-relaxed`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-notes" className={labelClass}>
              Internal notes (optional)
            </label>
            <input
              id="job-notes"
              type="text"
              value={clientNotes}
              onChange={e => setClientNotes(e.target.value)}
              placeholder="e.g. Needs soundalike music, wants 4K ProRes"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="job-ref" className={labelClass}>
              Reference / moodboard URL (optional)
            </label>
            <input
              id="job-ref"
              type="url"
              value={refUrl}
              onChange={e => setRefUrl(e.target.value)}
              placeholder="https://… or Figma link"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create job
          </Button>
        </div>
      </form>
    </Modal>
  );
}
