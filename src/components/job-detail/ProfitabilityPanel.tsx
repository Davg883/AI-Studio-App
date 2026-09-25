'use client';

import React, { useState } from 'react';
import { Job, ProfitabilityMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Percent, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ProfitabilityPanelProps {
  job: Job;
  profitability: ProfitabilityMetrics;
  onUpdateJobConfig: (updates: { channelFeePct?: number; contingencyPct?: number }) => void;
}

export function ProfitabilityPanel({
  job,
  profitability,
  onUpdateJobConfig,
}: ProfitabilityPanelProps) {
  const [channelFee, setChannelFee] = useState<number>(job.channelFeePct ?? 10);
  const [contingency, setContingency] = useState<number>(job.contingencyPct ?? 15);

  const handleChannelFeeChange = (val: number) => {
    setChannelFee(val);
    onUpdateJobConfig({ channelFeePct: val });
  };

  const handleContingencyChange = (val: number) => {
    setContingency(val);
    onUpdateJobConfig({ contingencyPct: val });
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200">
            Profitability
          </h3>
        </div>

        {/* Health status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold ${
              profitability.budgetStatus === 'healthy'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                : profitability.budgetStatus === 'warning'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                : 'bg-red-950/60 text-red-300 border border-red-800/50'
            }`}
          >
            {profitability.budgetStatus === 'healthy' ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            )}
            Expected Margin: {profitability.expectedMarginPct}%
          </span>
        </div>
      </div>

      {/* Main Grid: 6 Core Financial Levers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
        {/* Metric 1: Client Price */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <span className="text-xs uppercase text-zinc-400">
            1. Client Contract Price
          </span>
          <div className="mt-1 text-lg font-bold text-zinc-100">
            {formatCurrency(profitability.clientBudget)}
          </div>
          <span className="text-xs text-zinc-400 font-mono">Gross Inbound Revenue</span>
        </div>

        {/* Metric 2: Estimated Gen Spend */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-zinc-400">
              2. Higgsfield GPU Spend
            </span>
          </div>
          <div className="mt-1 text-lg font-bold text-cyan-300">
            {formatCurrency(profitability.estimatedGenSpend)}
          </div>
          <div className="text-xs text-zinc-400">
            {profitability.actualGenSpend > 0 ? (
              <span className="text-zinc-300">Actual: {formatCurrency(profitability.actualGenSpend)}</span>
            ) : (
              'Est. model inference'
            )}
          </div>
        </div>

        {/* Metric 3: Contingency Buffer */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-zinc-400">
              3. Iteration Contingency
            </span>
            <div className="flex items-center text-xs text-zinc-400">
              <input
                type="number"
                min="0"
                max="50"
                value={contingency}
                aria-label="Iteration contingency percent"
                onChange={e => handleContingencyChange(Number(e.target.value))}
                className="w-10 rounded bg-zinc-800 text-center text-zinc-200 border border-zinc-700 py-0.2"
              />
              <span className="ml-0.5">%</span>
            </div>
          </div>
          <div className="mt-1 text-lg font-bold text-amber-300">
            {formatCurrency(profitability.contingencyAmount)}
          </div>
          <span className="text-xs text-zinc-400 font-mono">Re-roll buffer reserve</span>
        </div>

        {/* Metric 4: Source/Channel Fee */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-zinc-400">
              4. {job.source} Fee
            </span>
            <div className="flex items-center text-xs text-zinc-400">
              <input
                type="number"
                min="0"
                max="30"
                value={channelFee}
                aria-label={`${job.source} fee percent`}
                onChange={e => handleChannelFeeChange(Number(e.target.value))}
                className="w-10 rounded bg-zinc-800 text-center text-zinc-200 border border-zinc-700 py-0.2"
              />
              <span className="ml-0.5">%</span>
            </div>
          </div>
          <div className="mt-1 text-lg font-bold text-zinc-300">
            {formatCurrency(profitability.channelFeeAmount)}
          </div>
          <span className="text-xs text-zinc-400 font-mono">Marketplace commission</span>
        </div>

        {/* Metric 5: Operator Labour */}
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
          <span className="text-xs uppercase text-zinc-400">
            5. Operator Labour
          </span>
          <div className="mt-1 text-lg font-bold text-zinc-300">
            {formatCurrency(profitability.laborCostEstimated ?? 0)}
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {job.laborHoursEstimated
              ? `${job.laborHoursEstimated}h @ ${formatCurrency(job.laborRatePerHourUSD ?? 0)}/h`
              : 'No labour estimate'}
          </span>
        </div>

        {/* Metric 6: Net Expected Gross Margin */}
        <div className="rounded border border-emerald-900/40 bg-emerald-950/20 p-3">
          <span className="text-xs uppercase text-emerald-400 font-semibold">
            6. Expected Gross Margin
          </span>
          <div className="mt-1 text-lg font-bold text-emerald-400">
            {formatCurrency(profitability.expectedGrossMargin)}
          </div>
          <div className="text-xs font-bold text-emerald-300">
            {profitability.expectedMarginPct}% of contract price
          </div>
        </div>
      </div>
    </div>
  );
}
