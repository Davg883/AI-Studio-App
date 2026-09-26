import { BriefAnalysis } from '@/types';
import { ModelCapabilityItem, getCatalogModelById } from '../models/capability-catalog';

/**
 * Shared model-selection rules.
 *
 * Both the ModelRouter (which builds the workflow) and the DeterministicEvaluator
 * (which prices Astra's proposed workflow to decide accept / review / reject) use these
 * functions, so the cost at analysis time is based on the same catalogue models the
 * planner will actually choose.
 */

export interface SelectionContext {
  rawBrief?: string;
  budget?: number;
}

export interface JobSignals {
  deliverables: BriefAnalysis['deliverables'];
  rawBriefLower: string;
  isVideoProject: boolean;
  hasProductReference: boolean;
  isFashionOrPortrait: boolean;
  hasTypographyReqs: boolean;
  isTalkingOrInterview: boolean;
  needsSocialCaptions: boolean;
  isHighTicketLuxury: boolean;
  hasVoiceRequirement: boolean;
  budget: number;
}

export interface ModelChoice {
  model: ModelCapabilityItem;
  reason: string;
}

type SignalSource = Pick<BriefAnalysis, 'deliverables' | 'suppliedAssets' | 'exactText'>;

export function deriveJobSignals(analysis: SignalSource, ctx: SelectionContext = {}): JobSignals {
  const rawBriefLower = (ctx.rawBrief || '').toLowerCase();
  const deliverables = analysis.deliverables || [];
  const budget = ctx.budget || 0;
  const includesAny = (...words: string[]) => words.some(w => rawBriefLower.includes(w));

  const isVideoProject = deliverables.some(
    d =>
      d.type.toLowerCase().includes('video') ||
      d.type.toLowerCase().includes('reel') ||
      (!!d.durationSeconds && d.durationSeconds > 0)
  );
  const hasProductReference =
    (analysis.suppliedAssets && analysis.suppliedAssets.length > 0) ||
    includesAny('product', 'bottle', 'can', 'packaging', 'dish', 'food');
  const isFashionOrPortrait = includesAny('fashion', 'editorial', 'portrait', 'model', 'chef', 'people');
  const hasTypographyReqs =
    deliverables.some(d => d.exactTextRequirements && d.exactTextRequirements.length > 0) ||
    (!!analysis.exactText && analysis.exactText.length > 0) ||
    includesAny('poster', 'typography', 'logo');
  const isTalkingOrInterview = includesAny('talking', 'interview', 'lip sync', 'speech');
  const needsSocialCaptions = deliverables.some(
    d => d.aspectRatio === '9:16' || d.type.toLowerCase().includes('reel') || d.type.toLowerCase().includes('tiktok')
  );
  const isHighTicketLuxury = budget >= 2500 || includesAny('luxury', 'cinematic');
  const hasVoiceRequirement =
    (!!analysis.exactText && analysis.exactText.length > 0) ||
    deliverables.some(d => d.exactTextRequirements && d.exactTextRequirements.length > 0) ||
    includesAny('voice', 'narrat', 'audio');

  return {
    deliverables,
    rawBriefLower,
    isVideoProject,
    hasProductReference: !!hasProductReference,
    isFashionOrPortrait,
    hasTypographyReqs,
    isTalkingOrInterview,
    needsSocialCaptions,
    isHighTicketLuxury,
    hasVoiceRequirement,
    budget,
  };
}

const must = (id: string): ModelCapabilityItem => {
  const model = getCatalogModelById(id);
  if (!model) throw new Error(`Capability catalogue is missing model '${id}'`);
  return model;
};

/** CONTROL keyframes: product / identity / packaging lock */
export function selectControlModel(s: JobSignals): ModelChoice {
  if (s.hasProductReference) {
    return {
      model: must('bytedance-seedream-2'),
      reason:
        'Seedream 2.0 excels at reference conditioning, locking exact product packaging, textures, and geometry against client assets while placing it naturally in lifestyle scenes.',
    };
  }
  if (s.hasTypographyReqs && !s.isVideoProject) {
    return {
      model: must('ideogram-v2.5'),
      reason: 'Ideogram 2.5 delivers exact typographic spelling and layout composition required by the client headline specifications.',
    };
  }
  if (s.isFashionOrPortrait) {
    return {
      model: must('higgsfield-soul-v2'),
      reason: 'Soul 2.0 HD provides industry-leading human skin texture, editorial lighting taste, and natural portrait depth.',
    };
  }
  return {
    model: getCatalogModelById('bytedance-seedream-2') || must('higgsfield-soul-v2'),
    reason:
      'Locks foundational lighting, environmental physics, and geometry from the approved Search concepts into high-resolution seed frames.',
  };
}

/** CONTROL camera trajectory pass (video deliverables) */
export function selectCameraModel(): ModelChoice {
  return {
    model: must('higgsfield-dop-2.5'),
    reason:
      'Enforces repeatable physical camera trajectories (orbital push-in, Steadicam tracking, crane tilt) without warping the locked subject keyframe.',
  };
}

/** SHIP: final client-facing synthesis */
export function selectShipModel(s: JobSignals): ModelChoice {
  if (s.isVideoProject) {
    if (s.isTalkingOrInterview) {
      return {
        model: must('minimax-video-01'),
        reason: 'MiniMax Video 01 excels at human facial micro-expressions and natural speech cadence.',
      };
    }
    if (s.isHighTicketLuxury && s.budget >= 3000) {
      return {
        model: getCatalogModelById('google-veo-2') || must('bytedance-seedance-2.5'),
        reason:
          'Veo 2 / Seedance 2.5 Master delivers elite photorealistic fluid dynamics, atmospheric particle scattering, and cinematic grade matching high-ticket commercial expectations.',
      };
    }
    return {
      model: must('bytedance-seedance-2.5'),
      reason:
        'ByteDance Seedance 2.5 is the current gold standard for commercial fluid dynamics, realistic cloth/food textures, and high temporal stability.',
    };
  }
  return {
    model: must('higgsfield-soul-v2'),
    reason: 'Renders full-resolution master stills with 10-bit color grading, natural optical bokeh, and immaculate surface details.',
  };
}

/** FINISH: voiceover or lip-synced speech */
export function selectVoiceModel(s: JobSignals): ModelChoice {
  return s.isTalkingOrInterview
    ? { model: must('higgsfield-speak-lip-sync'), reason: 'Lip-synced speech for on-camera talent.' }
    : { model: must('elevenlabs-voice-studio'), reason: 'Studio-grade narration master track.' };
}

/** FINISH: neural upscale & 4K master */
export function selectUpscaleModel(): ModelChoice {
  return {
    model: getCatalogModelById('topaz-video-ai-pro') || must('bytedance-super-res-4k'),
    reason: 'Neural upscale and interpolation to the delivery master resolution.',
  };
}

/**
 * Maps an abstract capability from Astra's proposed workflow to the catalogue model the
 * planner would choose for this job. Returns null for capabilities the planner has no
 * model for, so callers can route to human review instead of guessing a price.
 */
export function resolveCapabilityModel(capability: string, signals: JobSignals): ModelCapabilityItem | null {
  switch ((capability || '').toLowerCase().trim()) {
    case 'keyframe_generation':
      return selectControlModel(signals).model;
    case 'camera_motion':
      return selectCameraModel().model;
    case 'video_scene_synthesis':
      return selectShipModel(signals).model;
    case 'voiceover_synthesis':
      return selectVoiceModel(signals).model;
    case 'neural_upscale_grade':
      return selectUpscaleModel().model;
    default:
      return null;
  }
}
