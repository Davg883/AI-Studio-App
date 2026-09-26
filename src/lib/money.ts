/**
 * Money conventions.
 *
 * - Client quotations are in the job's currency (GBP for new jobs; jobs created before
 *   currency support have no `currency` and were priced in USD).
 * - Provider costs (Higgsfield, partners) are billed in USD and stay in USD wherever they
 *   are shown as provider spend. They are converted to the client currency only to compute
 *   contribution, using an explicit, displayed rate.
 */
import { Job } from '@/types';

export type ClientCurrency = 'GBP' | 'USD';
export const PROVIDER_CURRENCY = 'USD' as const;

/** Used only when USD_TO_GBP_RATE is not configured; always flagged as assumed in the UI. */
export const ASSUMED_USD_TO_GBP_RATE = 0.75;

export function jobCurrency(job: Pick<Job, 'currency'>): ClientCurrency {
  return job.currency ?? 'USD';
}

/** Rate to convert provider USD into the client currency (server-side: reads USD_TO_GBP_RATE). */
export function usdToClientRate(currency: ClientCurrency): { rate: number; isAssumed: boolean } {
  if (currency === 'USD') return { rate: 1, isAssumed: false };
  const configured = Number(process.env.USD_TO_GBP_RATE);
  return Number.isFinite(configured) && configured > 0
    ? { rate: configured, isAssumed: false }
    : { rate: ASSUMED_USD_TO_GBP_RATE, isAssumed: true };
}

export function formatMoney(amount: number | undefined | null, currency: ClientCurrency | 'USD' = 'USD'): string {
  const value = amount === undefined || amount === null || isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Generations only count as billed spend when they ran against the live provider. */
export function isSimulatedGeneration(gen: { meta?: Record<string, any> }): boolean {
  return gen.meta?.engineMode !== 'Higgsfield-Live';
}
