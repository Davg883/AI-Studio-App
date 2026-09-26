'use client';

import React from 'react';
import { Job, ProfitabilityMetrics, Workflow, Generation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatMoney, isSimulatedGeneration } from '@/lib/money';
import { PieChart, Calculator } from 'lucide-react';

interface CostsTabProps {
  job: Job;
  profitability: ProfitabilityMetrics;
  workflow?: Workflow | null;
  generations?: Generation[];
}

export function CostsTab({ job, profitability: p, workflow, generations = [] }: CostsTabProps) {
  const money = (n: number) => formatMoney(n, p.currency);
  const pctOfPrice = (n: number) => (p.clientBudget > 0 ? `${((n / p.clientBudget) * 100).toFixed(1)}%` : '—');

  // Provider spend by production stage (USD): estimate vs what has run, split simulated / billed
  const stageOfStep = new Map((workflow?.steps || []).map(s => [s.id, s.stage]));
  const stageBreakdown: Record<string, { estimated: number; simulated: number; billed: number; count: number }> = {};
  for (const step of workflow?.steps || []) {
    stageBreakdown[step.stage] ??= { estimated: 0, simulated: 0, billed: 0, count: 0 };
    stageBreakdown[step.stage].estimated += step.estimatedTotalCost;
    stageBreakdown[step.stage].count += 1;
  }
  for (const gen of generations) {
    const stage = stageOfStep.get(gen.stepId);
    if (!stage || !stageBreakdown[stage]) continue;
    const cost = gen.actualCost ?? gen.costEstimate ?? 0;
    if (isSimulatedGeneration(gen)) stageBreakdown[stage].simulated += cost;
    else stageBreakdown[stage].billed += cost;
  }

  const th = 'pb-2 font-medium';
  const td = 'py-2.5';

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-emerald-400" />
          Contribution breakdown
        </h4>
        <p className="text-xs text-zinc-400 mb-4">
          Client figures in {p.currency}. Provider spend is billed in USD
          {p.currency !== 'USD'
            ? ` and converted at 1 USD = ${formatMoney(p.fxRateUsdToClient, p.currency)}${p.fxRateIsAssumed ? ' (assumed rate)' : ''}`
            : ''}
          . Simulated runs are never billed.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className={th}>Component</th>
                <th className={th}>Basis</th>
                <th className={`${th} text-right`}>Estimate ({p.currency})</th>
                <th className={`${th} text-right`}>Simulated (USD)</th>
                <th className={`${th} text-right`}>Billed (USD)</th>
                <th className={`${th} text-right`}>% of price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200 font-mono">
              <tr>
                <td className={`${td} font-sans font-semibold text-zinc-100`}>Client price</td>
                <td className={`${td} font-sans text-zinc-400`}>Fixed quotation</td>
                <td className={`${td} text-right font-bold text-emerald-400`}>{money(p.clientBudget)}</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-400`}>100.0%</td>
              </tr>
              <tr>
                <td className={`${td} font-sans text-zinc-300`}>Channel fee ({job.source})</td>
                <td className={`${td} font-sans text-zinc-400`}>{p.channelFeePct}% of price</td>
                <td className={`${td} text-right text-red-300`}>−{money(p.channelFeeAmount)}</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-400`}>{pctOfPrice(p.channelFeeAmount)}</td>
              </tr>
              <tr>
                <td className={`${td} font-sans text-zinc-300`}>Generation (Higgsfield & partners)</td>
                <td className={`${td} font-sans text-zinc-400`}>
                  {workflow?.steps.length ? `${workflow.steps.length} steps · est. ${formatCurrency(p.estimatedGenSpendUSD)}` : 'No workflow yet'}
                </td>
                <td className={`${td} text-right text-cyan-300`}>−{money(p.estimatedGenSpend)}</td>
                <td className={`${td} text-right text-zinc-400`}>{formatCurrency(p.simulatedGenSpendUSD)}</td>
                <td className={`${td} text-right text-zinc-200`}>{formatCurrency(p.actualGenSpendUSD)}</td>
                <td className={`${td} text-right text-zinc-400`}>{pctOfPrice(p.estimatedGenSpend)}</td>
              </tr>
              <tr>
                <td className={`${td} font-sans text-zinc-300`}>Contingency</td>
                <td className={`${td} font-sans text-zinc-400`}>{p.contingencyPct}% of generation</td>
                <td className={`${td} text-right text-amber-300`}>−{money(p.contingencyAmount)}</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-400`}>{pctOfPrice(p.contingencyAmount)}</td>
              </tr>
              <tr className={p.laborCosted ? '' : 'bg-amber-950/20'}>
                <td className={`${td} font-sans text-zinc-300`}>Operator labour</td>
                <td className={`${td} font-sans text-zinc-400`}>
                  {p.laborCosted
                    ? `${p.laborHoursEstimated}h × ${money(p.laborRatePerHour ?? 0)}`
                    : 'Not costed: enter hours and rate in Contribution'}
                </td>
                <td className={`${td} text-right ${p.laborCosted ? 'text-zinc-300' : 'text-amber-300 font-sans'}`}>
                  {p.laborCosted ? `−${money(p.laborCostEstimated)}` : 'Missing'}
                </td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-500`}>—</td>
                <td className={`${td} text-right text-zinc-400`}>{p.laborCosted ? pctOfPrice(p.laborCostEstimated) : '—'}</td>
              </tr>

              <tr className={`font-bold border-t border-zinc-700 ${p.contributionComplete ? 'bg-emerald-950/20' : 'bg-amber-950/20'}`}>
                <td className={`py-3 font-sans ${p.contributionComplete ? 'text-emerald-400' : 'text-amber-200'}`}>
                  Expected contribution
                </td>
                <td className="py-3 font-sans font-normal text-zinc-400">Before overheads, subscriptions & tax</td>
                <td className={`py-3 text-right text-sm ${p.contributionComplete ? 'text-emerald-400' : 'text-amber-200'}`}>
                  {p.contributionComplete ? money(p.expectedContribution) : 'Incomplete'}
                </td>
                <td className="py-3 text-right text-zinc-500">—</td>
                <td className="py-3 text-right text-zinc-300 font-normal">
                  {p.actualContribution !== undefined ? money(p.actualContribution) : '—'}
                </td>
                <td className={`py-3 text-right text-sm ${p.contributionComplete ? 'text-emerald-400' : 'text-amber-200'}`}>
                  {p.contributionComplete ? `${p.expectedContributionPct}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {!p.contributionComplete && (
          <p className="mt-3 text-xs text-amber-200">
            Contribution is incomplete until {p.missingCosts.join(' and ')} {p.missingCosts.length > 1 ? 'are' : 'is'} costed.
            Without {p.missingCosts.length > 1 ? 'them' : 'it'}, contribution would read {money(p.expectedContribution)} ({p.expectedContributionPct}%), which overstates it.
          </p>
        )}
      </div>

      {/* Provider spend by production stage */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
        <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-4">
          <PieChart className="h-4 w-4 text-cyan-400" />
          Provider spend by production stage (USD)
        </h4>

        {Object.keys(stageBreakdown).length === 0 ? (
          <p className="text-xs text-zinc-400">No workflow yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stageBreakdown).map(([stage, data]) => (
              <div key={stage} className="rounded border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
                <span className="text-zinc-400">{stage}</span>
                <div className="text-base font-mono font-bold text-zinc-200 mt-1">
                  Est. {formatCurrency(data.estimated)}
                </div>
                <div className="text-zinc-400 mt-0.5">
                  {data.count} step(s) · Simulated {formatCurrency(data.simulated)} · Billed {formatCurrency(data.billed)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
