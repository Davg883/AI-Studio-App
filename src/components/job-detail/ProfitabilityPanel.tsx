'use client';

import React, { useEffect, useState } from 'react';
import { Job, ProfitabilityMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { PoundSterling, DollarSign, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export interface JobEconomicsUpdate {
  channelFeePct?: number;
  contingencyPct?: number;
  laborHoursEstimated?: number;
  laborRatePerHour?: number;
}

interface ProfitabilityPanelProps {
  job: Job;
  profitability: ProfitabilityMetrics;
  onUpdateJobConfig: (updates: JobEconomicsUpdate) => void;
}

export function ProfitabilityPanel({ job, profitability: p, onUpdateJobConfig }: ProfitabilityPanelProps) {
  const money = (n: number) => formatMoney(n, p.currency);
  const [channelFee, setChannelFee] = useState<string>(String(job.channelFeePct ?? 10));
  const [contingency, setContingency] = useState<string>(String(job.contingencyPct ?? 15));
  const [laborHours, setLaborHours] = useState<string>(p.laborHoursEstimated ? String(p.laborHoursEstimated) : '');
  const [laborRate, setLaborRate] = useState<string>(p.laborRatePerHour ? String(p.laborRatePerHour) : '');

  // Keep inputs in step with server values after a refresh
  useEffect(() => {
    setLaborHours(p.laborHoursEstimated ? String(p.laborHoursEstimated) : '');
    setLaborRate(p.laborRatePerHour ? String(p.laborRatePerHour) : '');
  }, [p.laborHoursEstimated, p.laborRatePerHour]);

  // Commit on blur rather than every keystroke
  const commitNumber = (raw: string, current: number | undefined, key: keyof JobEconomicsUpdate) => {
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value) || value < 0 || value === current) return;
    onUpdateJobConfig({ [key]: value });
  };

  const CurrencyIcon = p.currency === 'GBP' ? PoundSterling : DollarSign;
  const inputClass =
    'w-16 rounded bg-zinc-800 text-center text-zinc-200 border border-zinc-700 py-0.5 text-xs focus:outline-none focus:border-zinc-500';

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <CurrencyIcon className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200">Contribution</h3>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            p.budgetStatus === 'incomplete'
              ? 'bg-amber-950/60 text-amber-200 border border-amber-800/50'
              : p.budgetStatus === 'healthy'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
              : p.budgetStatus === 'warning'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              : 'bg-red-950/60 text-red-300 border border-red-800/50'
          }`}
        >
          {p.budgetStatus === 'incomplete' ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Incomplete: {p.missingCosts.join(' and ')} not costed
            </>
          ) : p.budgetStatus === 'healthy' ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Expected contribution: {p.expectedContributionPct}%
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Expected contribution: {p.expectedContributionPct}%
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
        {/* 1. Client price */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <span className="text-xs text-zinc-400">1. Client price</span>
          <div className="mt-1 text-lg font-mono font-bold text-zinc-100">{money(p.clientBudget)}</div>
          <span className="text-xs text-zinc-400">Quoted in {p.currency}</span>
        </div>

        {/* 2. Generation spend (provider, USD) */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <span className="text-xs text-zinc-400">2. Generation (estimate)</span>
          <div className="mt-1 text-lg font-mono font-bold text-cyan-300">{formatCurrency(p.estimatedGenSpendUSD)}</div>
          <div className="text-xs text-zinc-400 space-y-0.5">
            {p.currency !== 'USD' && <div>≈ {money(p.estimatedGenSpend)}</div>}
            <div>
              Simulated: {formatCurrency(p.simulatedGenSpendUSD)} · Billed: {formatCurrency(p.actualGenSpendUSD)}
            </div>
          </div>
        </div>

        {/* 3. Contingency */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between gap-1">
            <label htmlFor="econ-contingency" className="text-xs text-zinc-400">
              3. Contingency
            </label>
            <span className="flex items-center text-xs text-zinc-400">
              <input
                id="econ-contingency"
                type="number"
                min="0"
                max="100"
                value={contingency}
                onChange={e => setContingency(e.target.value)}
                onBlur={() => commitNumber(contingency, job.contingencyPct, 'contingencyPct')}
                className={inputClass}
              />
              <span className="ml-0.5">%</span>
            </span>
          </div>
          <div className="mt-1 text-lg font-mono font-bold text-amber-300">{money(p.contingencyAmount)}</div>
          <span className="text-xs text-zinc-400">Re-roll buffer on generation</span>
        </div>

        {/* 4. Channel fee */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between gap-1">
            <label htmlFor="econ-fee" className="text-xs text-zinc-400">
              4. {job.source} fee
            </label>
            <span className="flex items-center text-xs text-zinc-400">
              <input
                id="econ-fee"
                type="number"
                min="0"
                max="100"
                value={channelFee}
                onChange={e => setChannelFee(e.target.value)}
                onBlur={() => commitNumber(channelFee, job.channelFeePct, 'channelFeePct')}
                className={inputClass}
              />
              <span className="ml-0.5">%</span>
            </span>
          </div>
          <div className="mt-1 text-lg font-mono font-bold text-zinc-300">{money(p.channelFeeAmount)}</div>
          <span className="text-xs text-zinc-400">Marketplace commission</span>
        </div>

        {/* 5. Operator labour */}
        <div
          className={`rounded border p-3 ${
            p.laborCosted ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-amber-800/60 bg-amber-950/20'
          }`}
        >
          <span className="text-xs text-zinc-400">5. Operator labour</span>
          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <input
              aria-label="Labour hours"
              type="number"
              min="0"
              step="0.25"
              placeholder="hrs"
              value={laborHours}
              onChange={e => setLaborHours(e.target.value)}
              onBlur={() => commitNumber(laborHours, p.laborHoursEstimated, 'laborHoursEstimated')}
              className={inputClass}
            />
            <span>h ×</span>
            <input
              aria-label={`Labour rate per hour in ${p.currency}`}
              type="number"
              min="0"
              placeholder={p.currency === 'GBP' ? '£/h' : '$/h'}
              value={laborRate}
              onChange={e => setLaborRate(e.target.value)}
              onBlur={() => commitNumber(laborRate, p.laborRatePerHour, 'laborRatePerHour')}
              className={inputClass}
            />
          </div>
          <div className={`mt-1 text-lg font-mono font-bold ${p.laborCosted ? 'text-zinc-300' : 'text-amber-300'}`}>
            {p.laborCosted ? money(p.laborCostEstimated) : 'Not costed'}
          </div>
          <span className="text-xs text-zinc-400">Production, review & editing time</span>
        </div>

        {/* 6. Expected contribution */}
        <div
          className={`rounded border p-3 ${
            p.contributionComplete ? 'border-emerald-900/40 bg-emerald-950/20' : 'border-amber-800/60 bg-amber-950/20'
          }`}
        >
          <span className={`text-xs font-semibold ${p.contributionComplete ? 'text-emerald-400' : 'text-amber-300'}`}>
            6. Expected contribution
          </span>
          {p.contributionComplete ? (
            <>
              <div className="mt-1 text-lg font-mono font-bold text-emerald-400">{money(p.expectedContribution)}</div>
              <div className="text-xs font-bold text-emerald-300">{p.expectedContributionPct}% of client price</div>
            </>
          ) : (
            <>
              <div className="mt-1 text-lg font-bold text-amber-200">Incomplete</div>
              <div className="text-xs text-amber-200/80">
                {money(p.expectedContribution)} before {p.missingCosts.join(' and ')}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
        Contribution = client price − generation estimate − contingency − channel fee − operator labour. It excludes
        overheads, software subscriptions and tax, so it is not net profit.
        {p.currency !== 'USD' && (
          <>
            {' '}
            Provider costs are billed in USD and converted at 1 USD = {formatMoney(p.fxRateUsdToClient, p.currency)}
            {p.fxRateIsAssumed ? ' (assumed rate: set USD_TO_GBP_RATE to use your own)' : ''}.
          </>
        )}
      </p>
    </div>
  );
}
