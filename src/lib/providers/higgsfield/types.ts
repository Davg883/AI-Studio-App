/**
 * Higgsfield API Provider Types
 * Defines the request parameters, provider lifecycle statuses,
 * normalized internal asset shape, and execution results.
 */

export type HiggsfieldLifecycleStatus =
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'nsfw'
  | 'canceled';

export interface HiggsfieldCredentials {
  keyId: string;
  keySecret: string;
}

export interface MaskedCredentials {
  configured: boolean;
  keyIdMasked?: string;
  mode: 'live' | 'mock';
}

export interface DoPImageToVideoParams {
  model: 'dop-lite' | 'dop-turbo' | 'dop-standard';
  prompt: string;
  inputImages: Array<{ type: 'image_url'; image_url: string }>;
  motions?: Array<{ id: string; strength: number }>;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface SoulTextToImageParams {
  prompt: string;
  widthAndHeight?: string; // e.g. "1024x1024", "1536x1536", "1920x1080"
  quality?: '720p' | '1080p';
  batchSize?: 1 | 4;
  styleId?: string;
  styleStrength?: number;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface NormalizedAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  localUrl: string;        // Local permanent path e.g. /storage/generations/gen-123.mp4
  providerUrl: string;     // Ephemeral provider link (expires in 7 days)
  thumbnailUrl?: string;
  aspectRatio?: string;
  resolution?: string;
  durationSeconds?: number;
  format?: string;
  costUSD: number;
  provider: 'Higgsfield';
  model: string;
  requestId: string;
  status: 'completed' | 'failed' | 'nsfw' | 'canceled';
  reconciledCost: number;  // 0 if failed, nsfw, or canceled
  meta?: Record<string, any>;
}

export interface CostEstimateResult {
  supported: boolean;
  costUSD: number;
  currency: string;
  rawCredits?: number;
  source: 'provider_api' | 'catalog_fallback';
}

export interface GenerationExecutionResult {
  requestId: string;
  providerStatus: HiggsfieldLifecycleStatus;
  appStatus: 'Completed' | 'Failed' | 'Canceled';
  appTimeout: boolean;
  costEstimate: number;
  actualCost: number;      // Reconciled: strictly 0 for failed/nsfw/canceled/app_timeout
  error?: string;
  normalizedAsset?: NormalizedAsset;
  cancelUrl?: string;
  statusUrl?: string;
  startedAt: string;
  completedAt?: string;
}
