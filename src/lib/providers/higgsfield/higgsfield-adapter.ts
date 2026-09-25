import {
  HiggsfieldCredentials,
  HiggsfieldLifecycleStatus,
  MaskedCredentials,
  CostEstimateResult,
  GenerationExecutionResult,
  NormalizedAsset,
  SoulTextToImageParams,
  DoPImageToVideoParams,
} from './types';
import { AssetStorageService } from '../../services/asset-storage';

const HIGGSFIELD_BASE_URL = process.env.HIGGSFIELD_BASE_URL || 'https://api.higgsfield.ai';
const DEFAULT_POLL_INTERVAL_MS = 2500;
const MAX_POLL_TIME_MS = 300000; // 5 minutes application-level timeout

// Fallback high-fidelity sample assets for mock mode and testing
const MOCK_ASSETS = {
  soulImage: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
  ],
  dopVideo: [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  ],
  audio: [
    'https://actions.google.com/sounds/v1/ambiences/humming_room_tone.ogg',
  ],
};

export class HiggsfieldAdapter {
  /**
   * Securely retrieve server-side credentials.
   * Throws an error without exposing secret tokens if missing.
   */
  private static getCredentials(): HiggsfieldCredentials | null {
    // 1. Single credentials string: "KEY_ID:KEY_SECRET"
    const singleCreds = process.env.HF_CREDENTIALS;
    if (singleCreds && singleCreds.includes(':')) {
      const [keyId, keySecret] = singleCreds.split(':');
      if (keyId && keySecret) return { keyId: keyId.trim(), keySecret: keySecret.trim() };
    }

    // 2. Separate environment variables (recommended)
    const keyId = process.env.HF_API_KEY_ID || process.env.HF_API_KEY;
    const keySecret = process.env.HF_API_KEY_SECRET || process.env.HF_SECRET;

    if (
      keyId &&
      keySecret &&
      keyId !== 'undefined' &&
      keySecret !== 'undefined' &&
      keyId.trim() !== '' &&
      keySecret.trim() !== ''
    ) {
      return { keyId: keyId.trim(), keySecret: keySecret.trim() };
    }

    return null;
  }

  /**
   * Returns masked credential status for UI/inspection.
   * NEVER returns the secret key.
   */
  static getMaskedCredentials(): MaskedCredentials {
    const creds = this.getCredentials();
    const isMock = process.env.MOCK_MODE === 'true' || !creds;

    if (!creds) {
      return {
        configured: false,
        mode: 'mock',
      };
    }

    const keyId = creds.keyId;
    const masked = keyId.length > 8
      ? `${keyId.slice(0, 4)}...${keyId.slice(-4)}`
      : '****';

    return {
      configured: true,
      keyIdMasked: masked,
      mode: isMock ? 'mock' : 'live',
    };
  }

  /**
   * Check if running in mock mode
   */
  static isMockMode(): boolean {
    if (process.env.MOCK_MODE === 'true') return true;
    const creds = this.getCredentials();
    return !creds;
  }

  /**
   * Builds the official Authorization header
   */
  private static getAuthHeaders(creds: HiggsfieldCredentials): Record<string, string> {
    return {
      Authorization: `Key ${creds.keyId}:${creds.keySecret}`,
      'Content-Type': 'application/json',
      'User-Agent': 'higgsfield-server-js/2.0',
    };
  }

  /**
   * Pre-generation cost estimate via Higgsfield's estimate capability
   * Calls POST https://api.higgsfield.ai/estimate/{endpoint}
   */
  static async estimateCost(
    endpoint: string,
    payload: Record<string, any>,
    catalogDefaultCost: number
  ): Promise<CostEstimateResult> {
    if (this.isMockMode()) {
      return {
        supported: true,
        costUSD: catalogDefaultCost,
        currency: 'USD',
        source: 'catalog_fallback',
      };
    }

    const creds = this.getCredentials();
    if (!creds) {
      return {
        supported: false,
        costUSD: catalogDefaultCost,
        currency: 'USD',
        source: 'catalog_fallback',
      };
    }

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const estimateUrl = `${HIGGSFIELD_BASE_URL}/estimate${formattedEndpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(estimateUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(creds),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const costUSD = data.cost_usd ?? data.estimated_cost ?? (data.credits ? Number((data.credits * 0.01).toFixed(2)) : catalogDefaultCost);
        return {
          supported: true,
          costUSD: Number(costUSD.toFixed(2)),
          currency: 'USD',
          rawCredits: data.credits,
          source: 'provider_api',
        };
      }
    } catch {
      // Safe fallback if estimate endpoint not available or network error
    }

    return {
      supported: false,
      costUSD: catalogDefaultCost,
      currency: 'USD',
      source: 'catalog_fallback',
    };
  }

  /**
   * Run Soul 2.0 Text-to-Image Generation (Image Workflow)
   */
  static async generateSoulImage(
    params: SoulTextToImageParams,
    generationId: string,
    estimatedCost: number = 0.18
  ): Promise<GenerationExecutionResult> {
    const startedAt = new Date().toISOString();
    const endpoint = '/higgsfield-ai/soul/v2/standard';

    // Mock Mode Execution
    if (this.isMockMode()) {
      return this.runMockExecution({
        generationId,
        type: 'image',
        model: 'higgsfield-soul-v2',
        estimatedCost,
        prompt: params.prompt,
        aspectRatio: params.widthAndHeight === '1080x1920' ? '9:16' : '1:1',
        resolution: params.widthAndHeight || '1536x1536',
      });
    }

    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('Higgsfield API credentials not configured');
    }

    // Pre-generation cost estimate
    const estimate = await this.estimateCost(endpoint, params, estimatedCost);
    const activeCostEstimate = estimate.costUSD;

    const postPayload = {
      prompt: params.prompt,
      width_and_height: params.widthAndHeight || '1536x1536',
      quality: params.quality || '1080p',
      batch_size: params.batchSize || 1,
      style_id: params.styleId,
      style_strength: params.styleStrength,
      seed: params.seed,
      enhance_prompt: params.enhancePrompt ?? true,
    };

    const submitUrl = `${HIGGSFIELD_BASE_URL}${endpoint}`;
    let submitRes: Response;

    try {
      submitRes = await fetch(submitUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(creds),
        body: JSON.stringify(postPayload),
      });
    } catch (err: any) {
      return {
        requestId: `req_${Date.now()}`,
        providerStatus: 'failed',
        appStatus: 'Failed',
        appTimeout: false,
        costEstimate: activeCostEstimate,
        actualCost: 0, // Never charge failed generations
        error: `Provider connection error: ${err?.message || 'Network request failed'}`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }

    if (!submitRes.ok) {
      const errBody = await submitRes.text().catch(() => '');
      return {
        requestId: `req_${Date.now()}`,
        providerStatus: 'failed',
        appStatus: 'Failed',
        appTimeout: false,
        costEstimate: activeCostEstimate,
        actualCost: 0, // Never charge failed generations
        error: `Higgsfield generation rejected (${submitRes.status}): ${errBody.slice(0, 300)}`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id || `req_${Date.now()}`;
    const statusUrl = submitData.status_url || `${HIGGSFIELD_BASE_URL}/requests/${requestId}/status`;
    const cancelUrl = submitData.cancel_url || `${HIGGSFIELD_BASE_URL}/requests/${requestId}/cancel`;

    // Poll status with timeout separation
    return this.pollLifecycle({
      requestId,
      statusUrl,
      cancelUrl,
      creds,
      generationId,
      costEstimate: activeCostEstimate,
      outputType: 'image',
      model: 'higgsfield-soul-v2',
      prompt: params.prompt,
      aspectRatio: '1:1',
      startedAt,
    });
  }

  /**
   * Run DoP (Director of Photography) Video Generation (Video Workflow)
   */
  static async generateDoPVideo(
    params: DoPImageToVideoParams,
    generationId: string,
    estimatedCost: number = 1.60
  ): Promise<GenerationExecutionResult> {
    const startedAt = new Date().toISOString();
    const endpoint = '/v1/image2video/dop';

    // Mock Mode Execution
    if (this.isMockMode()) {
      return this.runMockExecution({
        generationId,
        type: 'video',
        model: 'higgsfield-dop-2.5',
        estimatedCost,
        prompt: params.prompt,
        aspectRatio: '16:9',
        resolution: '3840x2160',
        durationSeconds: 5,
      });
    }

    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('Higgsfield API credentials not configured');
    }

    const estimate = await this.estimateCost(endpoint, params, estimatedCost);
    const activeCostEstimate = estimate.costUSD;

    const postPayload = {
      model: params.model || 'dop-turbo',
      prompt: params.prompt,
      input_images: params.inputImages,
      motions: params.motions,
      seed: params.seed,
      enhance_prompt: params.enhancePrompt ?? true,
    };

    const submitUrl = `${HIGGSFIELD_BASE_URL}${endpoint}`;
    let submitRes: Response;

    try {
      submitRes = await fetch(submitUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(creds),
        body: JSON.stringify(postPayload),
      });
    } catch (err: any) {
      return {
        requestId: `req_${Date.now()}`,
        providerStatus: 'failed',
        appStatus: 'Failed',
        appTimeout: false,
        costEstimate: activeCostEstimate,
        actualCost: 0,
        error: `Provider connection error: ${err?.message || 'Network request failed'}`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }

    if (!submitRes.ok) {
      const errBody = await submitRes.text().catch(() => '');
      return {
        requestId: `req_${Date.now()}`,
        providerStatus: 'failed',
        appStatus: 'Failed',
        appTimeout: false,
        costEstimate: activeCostEstimate,
        actualCost: 0,
        error: `Higgsfield DoP generation rejected (${submitRes.status}): ${errBody.slice(0, 300)}`,
        startedAt,
        completedAt: new Date().toISOString(),
      };
    }

    const submitData = await submitRes.json();
    const requestId = submitData.request_id || `req_${Date.now()}`;
    const statusUrl = submitData.status_url || `${HIGGSFIELD_BASE_URL}/requests/${requestId}/status`;
    const cancelUrl = submitData.cancel_url || `${HIGGSFIELD_BASE_URL}/requests/${requestId}/cancel`;

    return this.pollLifecycle({
      requestId,
      statusUrl,
      cancelUrl,
      creds,
      generationId,
      costEstimate: activeCostEstimate,
      outputType: 'video',
      model: 'higgsfield-dop-2.5',
      prompt: params.prompt,
      aspectRatio: '16:9',
      durationSeconds: 5,
      startedAt,
    });
  }

  /**
   * Cancel a generation request while queued
   */
  static async cancelRequest(
    cancelUrl: string,
    requestId?: string
  ): Promise<{ success: boolean; message: string }> {
    if (this.isMockMode()) {
      return { success: true, message: 'Mock generation canceled successfully' };
    }

    const creds = this.getCredentials();
    if (!creds) {
      throw new Error('Higgsfield API credentials not configured');
    }

    const targetUrl = cancelUrl || (requestId ? `${HIGGSFIELD_BASE_URL}/requests/${requestId}/cancel` : '');
    if (!targetUrl) {
      return { success: false, message: 'No cancel endpoint available for this request' };
    }

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(creds),
      });

      if (res.ok) {
        return { success: true, message: 'Request successfully canceled on provider' };
      }

      const body = await res.text().catch(() => '');
      return {
        success: false,
        message: `Cancel rejected (${res.status}): ${body.slice(0, 200) || 'May have already started processing'}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cancel failed: ${err?.message || 'Network error'}`,
      };
    }
  }

  /**
   * Minimal Connection Test making the smallest inexpensive documented request
   * after explicit human confirmation.
   */
  static async testConnection(): Promise<{
    connected: boolean;
    mode: 'live' | 'mock';
    keyIdMasked?: string;
    details: string;
    latencyMs: number;
  }> {
    const creds = this.getCredentials();
    const masked = this.getMaskedCredentials();
    const startTime = Date.now();

    if (!creds || process.env.MOCK_MODE === 'true') {
      return {
        connected: true,
        mode: 'mock',
        keyIdMasked: masked.keyIdMasked,
        details: 'Mock Mode Active - Higgsfield simulation engine ready without live API keys.',
        latencyMs: 12,
      };
    }

    try {
      // Inexpensive documented call: POST /estimate/higgsfield-ai/soul/v2/standard
      const testPayload = {
        prompt: 'Minimal connection test probe',
        width_and_height: '1024x1024',
        quality: '720p',
        batch_size: 1,
      };

      const res = await fetch(`${HIGGSFIELD_BASE_URL}/estimate/higgsfield-ai/soul/v2/standard`, {
        method: 'POST',
        headers: this.getAuthHeaders(creds),
        body: JSON.stringify(testPayload),
      });

      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          mode: 'live',
          keyIdMasked: masked.keyIdMasked,
          details: `Connected successfully to Higgsfield API (${latencyMs}ms). Cost estimate returned: $${data.cost_usd ?? '0.00'}. Account authenticated.`,
          latencyMs,
        };
      }

      // If estimate endpoint returned 401 or 403
      if (res.status === 401) {
        return {
          connected: false,
          mode: 'live',
          keyIdMasked: masked.keyIdMasked,
          details: 'Authentication Failed (401): Invalid API Key ID or Secret credentials.',
          latencyMs,
        };
      }

      if (res.status === 403) {
        return {
          connected: false,
          mode: 'live',
          keyIdMasked: masked.keyIdMasked,
          details: 'Access Denied (403): Insufficient credits or missing permissions in Higgsfield Console.',
          latencyMs,
        };
      }

      return {
        connected: false,
        mode: 'live',
        keyIdMasked: masked.keyIdMasked,
        details: `Higgsfield API responded with status ${res.status}. Probe received response.`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        connected: false,
        mode: 'live',
        keyIdMasked: masked.keyIdMasked,
        details: `Connection probe error: ${err?.message || 'Network unreachable'}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Polls the provider status URL with exponential backoff & jitter.
   * Tracks application timeout separately from provider failure.
   */
  private static async pollLifecycle(opts: {
    requestId: string;
    statusUrl: string;
    cancelUrl?: string;
    creds: HiggsfieldCredentials;
    generationId: string;
    costEstimate: number;
    outputType: 'image' | 'video';
    model: string;
    prompt: string;
    aspectRatio?: string;
    durationSeconds?: number;
    startedAt: string;
  }): Promise<GenerationExecutionResult> {
    const {
      requestId,
      statusUrl,
      cancelUrl,
      creds,
      generationId,
      costEstimate,
      outputType,
      model,
      prompt,
      aspectRatio,
      durationSeconds,
      startedAt,
    } = opts;

    const pollStartTime = Date.now();
    let currentInterval = DEFAULT_POLL_INTERVAL_MS;

    while (true) {
      // 1. Separate application-level timeout check
      const elapsed = Date.now() - pollStartTime;
      if (elapsed > MAX_POLL_TIME_MS) {
        return {
          requestId,
          providerStatus: 'in_progress', // Internal timeout is NOT a provider failure
          appStatus: 'Failed',
          appTimeout: true,
          costEstimate,
          actualCost: 0, // Ledger is not charged for timed-out generations
          error: `Application polling timeout exceeded limit (${MAX_POLL_TIME_MS / 1000}s). Provider task ${requestId} may still be running on Higgsfield infrastructure.`,
          cancelUrl,
          statusUrl,
          startedAt,
          completedAt: new Date().toISOString(),
        };
      }

      // 2. Poll status endpoint
      try {
        const res = await fetch(statusUrl, {
          headers: this.getAuthHeaders(creds),
        });

        if (res.ok) {
          const data = await res.json();
          const providerStatus: HiggsfieldLifecycleStatus = data.status || 'in_progress';

          // Completed
          if (providerStatus === 'completed') {
            const rawUrl = outputType === 'video'
              ? data.video?.url || data.output_url || data.outputs?.[0]?.url
              : data.images?.[0]?.url || data.output_url || data.outputs?.[0]?.url;

            if (!rawUrl) {
              return {
                requestId,
                providerStatus: 'completed',
                appStatus: 'Failed',
                appTimeout: false,
                costEstimate,
                actualCost: 0,
                error: 'Higgsfield reported completion but did not return media asset URL',
                startedAt,
                completedAt: new Date().toISOString(),
              };
            }

            // Persist to local storage to prevent 7-day link expiration
            const localUrl = await AssetStorageService.persistRemoteAsset(
              rawUrl,
              generationId,
              outputType
            );

            const reconciledCost = costEstimate;

            const normalizedAsset: NormalizedAsset = {
              id: generationId,
              type: outputType,
              localUrl,
              providerUrl: rawUrl,
              thumbnailUrl: localUrl,
              aspectRatio: aspectRatio || (outputType === 'video' ? '16:9' : '1:1'),
              resolution: outputType === 'video' ? '3840x2160' : '1536x1536',
              durationSeconds,
              costUSD: reconciledCost,
              provider: 'Higgsfield',
              model,
              requestId,
              status: 'completed',
              reconciledCost,
              meta: {
                prompt,
                engineMode: 'Higgsfield-Live',
                pollDurationMs: elapsed,
              },
            };

            return {
              requestId,
              providerStatus: 'completed',
              appStatus: 'Completed',
              appTimeout: false,
              costEstimate,
              actualCost: reconciledCost,
              normalizedAsset,
              cancelUrl,
              statusUrl,
              startedAt,
              completedAt: new Date().toISOString(),
            };
          }

          // NSFW Moderation Rejection
          if (providerStatus === 'nsfw') {
            return {
              requestId,
              providerStatus: 'nsfw',
              appStatus: 'Failed',
              appTimeout: false,
              costEstimate,
              actualCost: 0, // Credits refunded by Higgsfield; 0 charged internally
              error: 'Generation rejected by Higgsfield safety & NSFW moderation filter. Credits refunded.',
              cancelUrl,
              statusUrl,
              startedAt,
              completedAt: new Date().toISOString(),
            };
          }

          // Provider Generation Failure
          if (providerStatus === 'failed') {
            return {
              requestId,
              providerStatus: 'failed',
              appStatus: 'Failed',
              appTimeout: false,
              costEstimate,
              actualCost: 0, // Never charge failed generations
              error: data.error || 'Higgsfield rendering pipeline failed.',
              cancelUrl,
              statusUrl,
              startedAt,
              completedAt: new Date().toISOString(),
            };
          }

          // Canceled
          if (providerStatus === 'canceled') {
            return {
              requestId,
              providerStatus: 'canceled',
              appStatus: 'Canceled',
              appTimeout: false,
              costEstimate,
              actualCost: 0,
              error: 'Generation was canceled before completion.',
              cancelUrl,
              statusUrl,
              startedAt,
              completedAt: new Date().toISOString(),
            };
          }
        }
      } catch {
        // Transient network error while polling; continue to next poll iteration
      }

      // Backoff with small jitter (between 2s and 8s)
      const jitter = Math.floor(Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, currentInterval + jitter));
      currentInterval = Math.min(currentInterval * 1.25, 8000);
    }
  }

  /**
   * Realistic simulated execution for offline / mock mode
   */
  private static async runMockExecution(opts: {
    generationId: string;
    type: 'image' | 'video' | 'audio';
    model: string;
    estimatedCost: number;
    prompt: string;
    aspectRatio?: string;
    resolution?: string;
    durationSeconds?: number;
  }): Promise<GenerationExecutionResult> {
    const {
      generationId,
      type,
      model,
      estimatedCost,
      prompt,
      aspectRatio,
      resolution,
      durationSeconds,
    } = opts;

    const startedAt = new Date().toISOString();
    const requestId = `hg_mock_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // Select sample asset
    let sampleRemoteUrl = '';
    if (type === 'image') {
      sampleRemoteUrl = MOCK_ASSETS.soulImage[Math.floor(Math.random() * MOCK_ASSETS.soulImage.length)];
    } else if (type === 'video') {
      sampleRemoteUrl = MOCK_ASSETS.dopVideo[Math.floor(Math.random() * MOCK_ASSETS.dopVideo.length)];
    } else {
      sampleRemoteUrl = MOCK_ASSETS.audio[0];
    }

    // Persist mock asset locally
    const localUrl = await AssetStorageService.persistRemoteAsset(
      sampleRemoteUrl,
      generationId,
      type
    );

    // Realistic small variance around estimate (0.95 - 1.05)
    const reconciledCost = Number((estimatedCost * (0.95 + Math.random() * 0.1)).toFixed(2));

    const normalizedAsset: NormalizedAsset = {
      id: generationId,
      type,
      localUrl,
      providerUrl: sampleRemoteUrl,
      thumbnailUrl: localUrl,
      aspectRatio: aspectRatio || (type === 'video' ? '16:9' : '1:1'),
      resolution: resolution || (type === 'video' ? '3840x2160' : '1536x1536'),
      durationSeconds,
      costUSD: reconciledCost,
      provider: 'Higgsfield',
      model,
      requestId,
      status: 'completed',
      reconciledCost,
      meta: {
        prompt,
        engineMode: 'Higgsfield-Simulation',
      },
    };

    return {
      requestId,
      providerStatus: 'completed',
      appStatus: 'Completed',
      appTimeout: false,
      costEstimate: estimatedCost,
      actualCost: reconciledCost,
      normalizedAsset,
      cancelUrl: `${HIGGSFIELD_BASE_URL}/requests/${requestId}/cancel`,
      statusUrl: `${HIGGSFIELD_BASE_URL}/requests/${requestId}/status`,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }
}
