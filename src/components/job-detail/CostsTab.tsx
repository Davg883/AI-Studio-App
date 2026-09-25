'use client';

import React from 'react';
import { Job, ProfitabilityMetrics, Workflow, Generation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, PieChart, ShieldCheck, Sliders, TrendingUp } from 'lucide-react';

interface CostsTabProps {
  job: Job;
  profitability: ProfitabilityMetrics;
  workflow?: Workflow | null;
  generations?: Generation[];
}

export function CostsTab({ job, profitability, workflow, generations = [] }: CostsTabProps) {
  // Compute breakdown by category/stage
  const stageBreakdown: Record<string, { estimated: number; actual: number; count: number }> = {};

  if (workflow?.steps) {
    workflow.steps.forEach(step => {
      if (!stageBreakdown[step.stage]) {
        stageBreakdown[step.stage] = { estimated: 0, actual: 0, count: 0 };
      }
      stageBreakdown[step.stage].estimated += step.estimatedTotalCost;
      stageBreakdown[step.stage].actual += step.actualCost || 0;
      stageBreakdown[step.stage].count += 1;
    });
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <h4 className="text-xs text-zinc-300 flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Unit Economics & Margin Cascade
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-2 font-medium">Cascade Component</th>
                <th className="pb-2 font-medium">Rate / Basis</th>
                <th className="pb-2 font-medium text-right">Estimated Amount</th>
                <th className="pb-2 font-medium text-right">Actual Incurred</th>
                <th className="pb-2 font-medium text-right">% of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
              <tr>
                <td className="py-2.5 font-bold text-zinc-100">Client Contract Price</td>
                <td className="py-2.5 text-zinc-400">Fixed Milestone Price</td>
                <td className="py-2.5 text-right font-bold text-emerald-400">
                  {formatCurrency(profitability.clientBudget)}
                </td>
                <td className="py-2.5 text-right font-bold text-emerald-400">
                  {formatCurrency(profitability.clientBudget)}
                </td>
                <td className="py-2.5 text-right text-zinc-400">100.0%</td>
              </tr>

              <tr>
                <td className="py-2.5 text-zinc-300">Marketplace Channel Fee ({job.source})</td>
                <td className="py-2.5 text-zinc-400">{profitability.channelFeePct}% of contract</td>
                <td className="py-2.5 text-right text-red-400">
                  -{formatCurrency(profitability.channelFeeAmount)}
                </td>
                <td className="py-2.5 text-right text-red-400">
                  -{formatCurrency(profitability.channelFeeAmount)}
                </td>
                <td className="py-2.5 text-right text-zinc-400">{profitability.channelFeePct}.0%</td>
              </tr>

              <tr>
                <td className="py-2.5 text-zinc-300">Higgsfield & Voice AI Inference</td>
                <td className="py-2.5 text-zinc-400">{workflow?.steps.length || 0} production steps</td>
                <td className="py-2.5 text-right text-cyan-300">
                  -{formatCurrency(profitability.estimatedGenSpend)}
                </td>
                <td className="py-2.5 text-right text-cyan-300">
                  -{formatCurrency(profitability.actualGenSpend || profitability.estimatedGenSpend)}
                </td>
                <td className="py-2.5 text-right text-zinc-400">
                  {((profitability.estimatedGenSpend / (profitability.clientBudget || 1)) * 100).toFixed(1)}%
                </td>
              </tr>

              <tr>
                <td className="py-2.5 text-zinc-300">Iteration & Re-roll Contingency</td>
                <td className="py-2.5 text-zinc-400">{profitability.contingencyPct}% of gen spend</td>
                <td className="py-2.5 text-right text-amber-400">
                  -{formatCurrency(profitability.contingencyAmount)}
                </td>
                <td className="py-2.5 text-right text-zinc-400">—</td>
                <td className="py-2.5 text-right text-zinc-400">
                  {((profitability.contingencyAmount / (profitability.clientBudget || 1)) * 100).toFixed(1)}%
                </td>
              </tr>

              <tr className="bg-emerald-950/20 font-bold border-t border-zinc-700">
                <td className="py-3 text-emerald-400">Expected Net Gross Margin</td>
                <td className="py-3 text-emerald-300">Net Retained Studio Profit</td>
                <td className="py-3 text-right text-emerald-400 text-sm">
                  {formatCurrency(profitability.expectedGrossMargin)}
                </td>
                <td className="py-3 text-right text-emerald-400 text-sm">
                  {profitability.actualGrossMargin ? formatCurrency(profitability.actualGrossMargin) : '—'}
                </td>
                <td className="py-3 text-right text-emerald-400 text-sm">
                  {profitability.expectedMarginPct}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Spend by Pipeline Stage */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <h4 className="text-xs text-zinc-300 flex items-center gap-2 mb-4">
          <PieChart className="h-4 w-4 text-cyan-400" />
          Model Spend by Production Stage
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(stageBreakdown).map(([stage, data]) => (
            <div key={stage} className="rounded border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
              <span className="text-zinc-400 text-xs uppercase">{stage}</span>
              <div className="text-base font-bold text-zinc-200 mt-1">
                {formatCurrency(data.actual > 0 ? data.actual : data.estimated)}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {data.count} step(s) • Est: {formatCurrency(data.estimated)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
