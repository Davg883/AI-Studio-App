import { Job, Workflow, Generation, ProfitabilityMetrics } from '@/types';

export class CostCalculator {
  static calculate(
    job: Pick<Job, 'budget' | 'channelFeePct' | 'contingencyPct' | 'laborHoursEstimated' | 'laborHoursActual' | 'laborRatePerHourUSD'>,
    workflow?: Workflow | null,
    generations?: Generation[] | null
  ): ProfitabilityMetrics {
    const clientBudget = job.budget || 0;
    const contingencyPct = job.contingencyPct ?? 15;
    const channelFeePct = job.channelFeePct ?? 10;

    // Calculate estimated generation spend from workflow steps
    let estimatedGenSpend = 0;
    if (workflow?.steps && workflow.steps.length > 0) {
      estimatedGenSpend = workflow.steps.reduce((sum, step) => {
        return sum + (step.estimatedTotalCost || step.unitCost * step.estimatedAttempts || 0);
      }, 0);
    }

    // Calculate actual spend from generations completed
    let actualGenSpend = 0;
    if (generations && generations.length > 0) {
      actualGenSpend = generations.reduce((sum, gen) => {
        return sum + (gen.actualCost ?? gen.costEstimate ?? 0);
      }, 0);
    }

    const contingencyAmount = Number(((estimatedGenSpend * contingencyPct) / 100).toFixed(2));
    const channelFeeAmount = Number(((clientBudget * channelFeePct) / 100).toFixed(2));

    // Operator labour is a real cost; include it wherever it has been estimated so every margin figure agrees
    const laborRate = job.laborRatePerHourUSD ?? 0;
    const laborCostEstimated = Number(((job.laborHoursEstimated ?? 0) * laborRate).toFixed(2));
    const laborCostActual = Number(((job.laborHoursActual ?? job.laborHoursEstimated ?? 0) * laborRate).toFixed(2));

    const totalEstimatedCost = Number(
      (estimatedGenSpend + contingencyAmount + channelFeeAmount + laborCostEstimated).toFixed(2)
    );

    const expectedGrossMargin = Number((clientBudget - totalEstimatedCost).toFixed(2));
    const expectedMarginPct = clientBudget > 0
      ? Number(((expectedGrossMargin / clientBudget) * 100).toFixed(1))
      : 0;

    const actualTotalCost = Number((actualGenSpend + channelFeeAmount + laborCostActual).toFixed(2));
    const actualGrossMargin = Number((clientBudget - actualTotalCost).toFixed(2));
    const actualMarginPct = clientBudget > 0
      ? Number(((actualGrossMargin / clientBudget) * 100).toFixed(1))
      : 0;

    let budgetStatus: 'healthy' | 'warning' | 'deficit' = 'healthy';
    if (expectedMarginPct < 30 || expectedGrossMargin < 0) {
      budgetStatus = 'deficit';
    } else if (expectedMarginPct < 55) {
      budgetStatus = 'warning';
    }

    return {
      clientBudget,
      estimatedGenSpend: Number(estimatedGenSpend.toFixed(2)),
      actualGenSpend: Number(actualGenSpend.toFixed(2)),
      contingencyPct,
      contingencyAmount,
      channelFeePct,
      channelFeeAmount,
      totalEstimatedCost,
      expectedGrossMargin,
      expectedMarginPct,
      actualGrossMargin,
      actualMarginPct,
      budgetStatus,
      laborCostEstimated,
      laborCostActual,
    };
  }
}
