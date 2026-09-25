// Model catalog for Higgsfield and partnered finishing tools
export interface ModelCatalogItem {
  id: string;
  name: string;
  provider: 'Higgsfield' | 'ElevenLabs' | 'NeuralMaster';
  category: 'image' | 'video' | 'motion' | 'voice' | 'finishing';
  description: string;
  unitCostUSD: number;
  costUnit: 'per frame' | 'per second' | 'per 5s clip' | 'per 1k chars' | 'per render';
  avgAttempts: number;
}

export const HIGGSFIELD_MODELS: ModelCatalogItem[] = [
  {
    id: 'higgsfield-cinematic-v3',
    name: 'Higgsfield Cinematic Motion V3',
    provider: 'Higgsfield',
    category: 'video',
    description: 'Flagship 4K high-coherence generative video model with photorealistic lighting & physics.',
    unitCostUSD: 1.25,
    costUnit: 'per 5s clip',
    avgAttempts: 2.2,
  },
  {
    id: 'higgsfield-dop-2.5',
    name: 'Higgsfield DoP 2.5 (Director of Photography)',
    provider: 'Higgsfield',
    category: 'motion',
    description: 'Precision camera control: Steadicam, dolly zoom, orbit 360, crane rise, motion tracking.',
    unitCostUSD: 1.60,
    costUnit: 'per 5s clip',
    avgAttempts: 1.8,
  },
  {
    id: 'higgsfield-soul-v2',
    name: 'Higgsfield Soul 2.0 Standard / HD',
    provider: 'Higgsfield',
    category: 'image',
    description: 'Foundation photo & concept generation model with cinematic lighting, depth, and aesthetics.',
    unitCostUSD: 0.18,
    costUnit: 'per render',
    avgAttempts: 3.0,
  },
  {
    id: 'higgsfield-keyframe-pro',
    name: 'Higgsfield Concept Keyframe Pro',
    provider: 'Higgsfield',
    category: 'image',
    description: 'Ultra-high-fidelity base keyframe generation with cinematic lens flare & depth maps.',
    unitCostUSD: 0.18,
    costUnit: 'per render',
    avgAttempts: 3.0,
  },
  {
    id: 'higgsfield-v2v-control',
    name: 'Higgsfield Video-to-Video Stylizer',
    provider: 'Higgsfield',
    category: 'video',
    description: 'Temporal consistency transfer, material restyling, and lighting relit passes.',
    unitCostUSD: 1.40,
    costUnit: 'per 5s clip',
    avgAttempts: 2.0,
  },
  {
    id: 'elevenlabs-voice-studio',
    name: 'ElevenLabs Voice Studio Ultra',
    provider: 'ElevenLabs',
    category: 'voice',
    description: 'High-emotion cinematic narrative voiceover synthesis with studio master compression.',
    unitCostUSD: 0.35,
    costUnit: 'per 1k chars',
    avgAttempts: 1.2,
  },
  {
    id: 'higgsfield-neural-finisher-4k',
    name: 'Higgsfield Neural Master 4K & Denoise',
    provider: 'Higgsfield',
    category: 'finishing',
    description: 'Temporal super-resolution, motion deblur, grain matching, and 10-bit HDR grade.',
    unitCostUSD: 0.85,
    costUnit: 'per render',
    avgAttempts: 1.0,
  },
];

// Mapping from abstract capability requested by Astra to concrete catalog model
export const CAPABILITY_TO_MODEL_ID: Record<string, string> = {
  keyframe_generation: 'higgsfield-soul-v2',
  camera_motion: 'higgsfield-dop-2.5',
  video_scene_synthesis: 'higgsfield-cinematic-v3',
  voiceover_synthesis: 'elevenlabs-voice-studio',
  neural_upscale_grade: 'higgsfield-neural-finisher-4k',
  video_to_video: 'higgsfield-v2v-control',
};

export function getModelByCapability(capability: string): ModelCatalogItem | null {
  const normalized = capability?.toLowerCase().trim();
  const modelId = CAPABILITY_TO_MODEL_ID[normalized];
  if (!modelId) return null;
  return HIGGSFIELD_MODELS.find(m => m.id === modelId) || null;
}

export const SOURCE_DEFAULT_FEES: Record<string, number> = {
  Upwork: 10,
  Fiverr: 20,
  Contra: 0,
  Email: 0,
  'Direct Lead': 0,
};

export const OPERATOR_GUARDRAILS = {
  DISALLOWED_AUTONOMOUS_ACTIONS: [
    'Scraping marketplace listings or profiles',
    'Auto-submitting proposals or bids to Upwork/Fiverr/Contra',
    'Auto-accepting client offers or contracts',
    'Auto-messaging clients via 3rd party marketplace APIs',
    'Auto-delivering files through marketplace deliverables interface without operator sign-off',
  ],
  MANDATORY_HUMAN_APPROVAL_POINTS: [
    'Initial workflow generation plan approval',
    'Maximum production budget ceiling',
    'Any budget overrun or incremental cost increase (> $0)',
    'Material changes to workflow steps or creative prompt intent',
    'Rights / trademark / soundalike likeness issues',
    'Final client deliverables export and sign-off',
  ],
};
