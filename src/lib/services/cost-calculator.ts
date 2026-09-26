import { Job, Workflow, Generation, ProfitabilityMetrics } from '@/types';
import { jobCurrency, usdToClientRate, isSimulatedGeneration } from '../money';

const round2 = (n: number) => Number(n.toFixed(2));

export class CostCalculator {
  /**
   * Single source for job economics (see ProfitabilityMetrics for the contribution definition).
   * Provider spend stays in USD; client-facing figures are in the job's currency.
   */
  static calculate(
    job: Pick<
      Job,
      'budget' | 'channelFeePct' | 'contingencyPct' | 'laborHoursEstimated' | 'laborRatePerHour' | 'laborRatePerHourUSD' | 'currency'
    >,
    workflow?: Workflow | null,
    generations?: Generation[] | null
  ): ProfitabilityMetrics {
    const currency = jobCurrency(job);
    const { rate: fx, isAssumed: fxRateIsAssumed } = usdToClientRate(currency);

    const clientBudget = job.budget || 0;
    const contingencyPct = job.contingencyPct ?? 15;
    const channelFeePct = job.channelFeePct ?? 10;

    // Provider spend (USD)
    const hasProductionEstimate = !!workflow?.steps?.length;
    const estimatedGenSpendUSD = hasProductionEstimate
      ? workflow!.steps.reduce(
          (sum, step) => sum + (step.estimatedTotalCost || step.unitCost * step.estimatedAttempts || 0),
          0
        )
      : 0;
    let simulatedGenSpendUSD = 0;
    let actualGenSpendUSD = 0;
    for (const gen of generations || []) {
      const cost = gen.actualCost ?? gen.costEstimate ?? 0;
      if (isSimulatedGeneration(gen)) simulatedGenSpendUSD += cost;
      else actualGenSpendUSD += cost;
    }

    // Client currency
    const estimatedGenSpend = round2(estimatedGenSpendUSD * fx);
    const contingencyAmount = round2((estimatedGenSpend * contingencyPct) / 100);
    const channelFeeAmount = round2((clientBudget * channelFeePct) / 100);

    const laborHoursEstimated = job.laborHoursEstimated;
    const laborRatePerHour = job.laborRatePerHour ?? job.laborRatePerHourUSD;
    const laborCosted = (laborHoursEstimated ?? 0) > 0 && (laborRatePerHour ?? 0) > 0;
    const laborCostEstimated = laborCosted ? round2(laborHoursEstimated! * laborRatePerHour!) : 0;

    const totalEstimatedCost = round2(estimatedGenSpend + contingencyAmount + channelFeeAmount + laborCostEstimated);
    const expectedContribution = round2(clientBudget - totalEstimatedCost);
    const expectedContributionPct = clientBudget > 0 ? Number(((expectedContribution / clientBudget) * 100).toFixed(1)) : 0;

    const missingCosts: string[] = [];
    if (!laborCosted) missingCosts.push('operator labour');
    if (!hasProductionEstimate) missingCosts.push('production (no workflow yet)');
    const contributionComplete = missingCosts.length === 0;

    let actualContribution: number | undefined;
    let actualContributionPct: number | undefined;
    if (actualGenSpendUSD > 0) {
      actualContribution = round2(clientBudget - (actualGenSpendUSD * fx + channelFeeAmount + laborCostEstimated));
      actualContributionPct = clientBudget > 0 ? Number(((actualContribution / clientBudget) * 100).toFixed(1)) : 0;
    }

    let budgetStatus: ProfitabilityMetrics['budgetStatus'] = 'healthy';
    if (!contributionComplete) {
      budgetStatus = 'incomplete';
    } else if (expectedContributionPct < 30 || expectedContribution < 0) {
      budgetStatus = 'deficit';
    } else if (expectedContributionPct < 55) {
      budgetStatus = 'warning';
    }

    return {
      currency,
      fxRateUsdToClient: fx,
      fxRateIsAssumed,
      clientBudget,
      estimatedGenSpendUSD: round2(estimatedGenSpendUSD),
      simulatedGenSpendUSD: round2(simulatedGenSpendUSD),
      actualGenSpendUSD: round2(actualGenSpendUSD),
      estimatedGenSpend,
      contingencyPct,
      contingencyAmount,
      channelFeePct,
      channelFeeAmount,
      laborCosted,
      laborHoursEstimated,
      laborRatePerHour,
      laborCostEstimated,
      totalEstimatedCost,
      expectedContribution,
      expectedContributionPct,
      contributionComplete,
      missingCosts,
      actualContribution,
      actualContributionPct,
      budgetStatus,
    };
  }
}
