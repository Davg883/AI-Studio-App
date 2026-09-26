/**
 * Configurable Capability Catalog from Currently Documented Higgsfield & Partner Models
 *
 * Models are explicitly grouped by Production Role:
 * - SEARCH: Cheap or fast enough to generate multiple hooks, compositions, and rough concepts.
 * - CONTROL: Best when workflow must preserve product, face, character, exact motion, layout, logo, label, or text.
 * - SHIP: Premium models used after the concept is chosen for the final client-facing asset.
 * - FINISH: Upscaling, denoising, lip sync, voice, captions, localization, and export.
 */

export type ProductionRole = 'SEARCH' | 'CONTROL' | 'SHIP' | 'FINISH';

export interface ModelCapabilityItem {
  id: string;
  name: string;
  family: string;
  provider: 'Higgsfield' | 'Partner';
  role: ProductionRole;
  category: 'image' | 'video' | 'motion' | 'voice' | 'finishing';
  description: string;
  bestUsedFor: string;
  capabilities: string[];
  knownFailureModes: string[];
  failureMitigation: string;
  unitCostUSD: number;
  costUnit: 'per render' | 'per 5s clip' | 'per 10s clip' | 'per minute' | 'per 1k chars';
  avgAttempts: number;
  typicalQueueTimeSeconds: number;
  supportedResolutions: string[];
  supportedAspectRatios: string[];
  maxDurationSeconds?: number;
  operation?: 'text-to-video' | 'image-to-video' | 'text-to-image' | 'inpaint' | 'upscale' | 'voiceover' | 'motion';
  accessRoute?: 'Official SDK' | 'REST' | 'SDK & REST';
  exactModelId?: string;
  supportedInputs?: string[];
  quoteLabel?: 'Verified Catalog Quote' | 'Example Quote (Pending Live Benchmark)';
}

export const CAPABILITY_CATALOG: ModelCapabilityItem[] = [
  // ==========================================
  // SEARCH ROLE: Rapid, Low-Cost Exploration
  // ==========================================
  {
    id: 'flux-schnell',
    name: 'Flux 1.1 Schnell (Concept Speed)',
    family: 'Flux',
    provider: 'Higgsfield',
    role: 'SEARCH',
    category: 'image',
    description: 'Sub-second foundation image model built for high-throughput visual brainstorming and mood exploration.',
    bestUsedFor: 'Generating 8-16 quick composition and lighting ideas before locking a hero direction.',
    capabilities: ['fast_iteration', 'composition_search', 'lighting_test', 'moodboarding'],
    knownFailureModes: [
      'Micro-detail and hands may show anatomical softness in 4-step turbo mode.',
      'Text rendering is limited to short 1-2 word concepts.'
    ],
    failureMitigation: 'Use only for broad aesthetic exploration; promote winner to CONTROL or SHIP stage for detail resolution.',
    unitCostUSD: 0.05,
    costUnit: 'per render',
    avgAttempts: 4.0,
    typicalQueueTimeSeconds: 4,
    supportedResolutions: ['1024x1024', '1920x1080', '1080x1920'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5'],
  },
  {
    id: 'wan-2.1-fast',
    name: 'Wan 2.1 Fast / Lite (Motion Search)',
    family: 'Wan',
    provider: 'Higgsfield',
    role: 'SEARCH',
    category: 'video',
    description: 'Low-cost, high-speed video generator designed for fast motion hook testing and scene blocking.',
    bestUsedFor: 'Testing camera rhythms, kinetic pacing, and initial movement hooks without burning video budget.',
    capabilities: ['fast_video_test', 'camera_speed_check', 'kinetic_hooks', 'rough_motion'],
    knownFailureModes: [
      'Motion blur and smear can occur during rapid 180-degree rotational moves.',
      'Fine background patterns can lose temporal coherence.'
    ],
    failureMitigation: 'Generate 4-6 rough 5s clips, select the top 1-2 movement curves, then seed into Seedance or Kling for final ship.',
    unitCostUSD: 0.45,
    costUnit: 'per 5s clip',
    avgAttempts: 3.0,
    typicalQueueTimeSeconds: 20,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },
  {
    id: 'seedance-fast',
    name: 'ByteDance Seedance 2.5 Fast',
    family: 'Seedance',
    provider: 'Higgsfield',
    role: 'SEARCH',
    category: 'video',
    description: 'Rapid video concept synthesis lane using Seedance lightweight architecture for rapid shot drafting.',
    bestUsedFor: 'Rapid cinematic video concept verification and director shot testing.',
    capabilities: ['video_drafting', 'pacing_verification', 'action_blocking'],
    knownFailureModes: [
      'Occasional frame jitter on high-frequency fluid particles.',
      'Slight color saturation drift across the final second.'
    ],
    failureMitigation: 'Keep prompts concise; verify composition before executing full Seedance 2.5 master render.',
    unitCostUSD: 0.50,
    costUnit: 'per 5s clip',
    avgAttempts: 2.5,
    typicalQueueTimeSeconds: 25,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },
  {
    id: 'pixverse-v3-fast',
    name: 'PixVerse V3 Fast Lane',
    family: 'PixVerse',
    provider: 'Higgsfield',
    role: 'SEARCH',
    category: 'video',
    description: 'Dynamic kinetic video prototyping model with strong responsiveness to action verbs and camera cues.',
    bestUsedFor: 'Fast action verification, vehicle drift testing, dynamic sports motion exploration.',
    capabilities: ['action_dynamics', 'camera_testing', 'sports_motion'],
    knownFailureModes: [
      'Subject boundary haloing against high-contrast backgrounds.',
      'Occasional speed ramping inconsistency.'
    ],
    failureMitigation: 'Use neutral backgrounds for concept phase; transfer validated motion parameters to SHIP stage.',
    unitCostUSD: 0.40,
    costUnit: 'per 5s clip',
    avgAttempts: 3.0,
    typicalQueueTimeSeconds: 18,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },
  {
    id: 'ltx-video-fast',
    name: 'LTX Video High-Speed Animatics',
    family: 'LTX',
    provider: 'Higgsfield',
    role: 'SEARCH',
    category: 'video',
    description: 'Ultra-low latency diffusion transformer for instant moving animatics and storyboard timings.',
    bestUsedFor: 'Validating rough video cut duration and edit timeline timing.',
    capabilities: ['animatics', 'timing_checks', 'rough_motion'],
    knownFailureModes: [
      'Lower photorealism and synthetic edge artifacts.'
    ],
    failureMitigation: 'Strictly internal animatic tool; do not export directly to client without disclaimer.',
    unitCostUSD: 0.35,
    costUnit: 'per 5s clip',
    avgAttempts: 2.0,
    typicalQueueTimeSeconds: 12,
    supportedResolutions: ['720p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },

  // ==========================================
  // CONTROL ROLE: Preservation, Edits & Text
  // ==========================================
  {
    id: 'bytedance-seedream-2',
    name: 'ByteDance Seedream 2.0 (Product & Reference Lock)',
    family: 'Seedream',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'image',
    description: 'Premier reference-conditioned image model built to preserve exact product packaging, textures, and geometry across lifestyle scenes.',
    bestUsedFor: 'Client product placement, bottle silhouettes, consumer goods packaging, and multi-angle lifestyle consistency.',
    capabilities: ['product_preservation', 'reference_control', 'lifestyle_staging', 'geometry_lock'],
    knownFailureModes: [
      'Can stiffen organic elements (splashes, leaves) if reference weight is over 0.85.',
      'Reflections on clear glass bottles may show slight refraction warping.'
    ],
    failureMitigation: 'Set reference strength to 0.72-0.78 for fluid or action scenes; pair with Qwen Image Edit for label touch-ups.',
    unitCostUSD: 0.20,
    costUnit: 'per render',
    avgAttempts: 2.2,
    typicalQueueTimeSeconds: 10,
    supportedResolutions: ['1024x1024', '2048x2048', '3840x2160'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5'],
    operation: 'text-to-image',
    accessRoute: 'Official SDK',
    exactModelId: 'bytedance/seedream-4.0/text-to-image',
    supportedInputs: ['prompt', 'reference_image', 'aspect_ratio'],
    quoteLabel: 'Verified Catalog Quote',
  },
  {
    id: 'higgsfield-marketing-studio',
    name: 'Marketing Studio Image (E-Commerce & Packshots)',
    family: 'Marketing Studio',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'image',
    description: 'Commercial staging engine specialized for multi-angle studio packshots and branded lifestyle environments.',
    bestUsedFor: 'E-commerce white/grey seamless studio shots and clean commercial table-top staging.',
    capabilities: ['packshot_mastery', 'clean_shadows', 'commercial_staging'],
    knownFailureModes: [
      'Can feel overly sterile or clinical if natural ambient lighting prompts are omitted.'
    ],
    failureMitigation: 'Inject volumetric atmosphere or natural window bounce lighting into the prompt.',
    unitCostUSD: 0.25,
    costUnit: 'per render',
    avgAttempts: 2.0,
    typicalQueueTimeSeconds: 12,
    supportedResolutions: ['2048x2048', '3840x2160'],
    supportedAspectRatios: ['1:1', '4:5', '16:9'],
    operation: 'text-to-image',
    accessRoute: 'REST',
    exactModelId: 'higgsfield/marketing-studio-v1',
    supportedInputs: ['prompt', 'subject_mask'],
    quoteLabel: 'Verified Catalog Quote',
  },
  {
    id: 'qwen-image-edit-v2',
    name: 'Qwen Image Edit / Inpaint Pro',
    family: 'Qwen',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'image',
    description: 'Precision surgical image editor and inpainter for localized correction, label repair, and continuity fixes.',
    bestUsedFor: 'Fixing warped logos, correcting ingredient lists on packaging, repairing hand artifacts, and continuity repairs between shots.',
    capabilities: ['surgical_inpaint', 'packaging_correction', 'continuity_repair', 'label_text_touchup'],
    knownFailureModes: [
      'Hard edge boundary visible if inpainting mask feathering is below 8px.',
      'Subtle color space mismatch on metallic gradients if whole bounding box is not selected.'
    ],
    failureMitigation: 'Feather inpaint mask by 12-16px and preserve original raw color profile metadata.',
    unitCostUSD: 0.15,
    costUnit: 'per render',
    avgAttempts: 1.8,
    typicalQueueTimeSeconds: 8,
    supportedResolutions: ['1024x1024', '2048x2048', '3840x2160'],
    supportedAspectRatios: ['any'],
    operation: 'inpaint',
    accessRoute: 'REST',
    exactModelId: 'qwen/image-edit-2.0/inpaint',
    supportedInputs: ['image', 'mask', 'prompt'],
    quoteLabel: 'Example Quote (Pending Live Benchmark)',
  },
  {
    id: 'ideogram-v2.5',
    name: 'Ideogram 2.5 (Typography & Poster Design)',
    family: 'Ideogram',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'image',
    description: 'State-of-the-art typographic layout model capable of rendering precise, legible brand slogans, poster titles, and packaging copy.',
    bestUsedFor: 'Key art posters, hero title cards, headline text on promotional graphics, and table talker cards.',
    capabilities: ['typography_rendering', 'poster_layout', 'headline_rendering', 'graphic_design'],
    knownFailureModes: [
      'Struggles with long body copy (>15 words); best suited for 1-6 word punchy headlines.',
      'Script / cursive fonts can occasionally connect unintended ligatures.'
    ],
    failureMitigation: 'Pass exact text inside explicit quotes; keep typographic requests to core headlines and titles.',
    unitCostUSD: 0.12,
    costUnit: 'per render',
    avgAttempts: 1.6,
    typicalQueueTimeSeconds: 10,
    supportedResolutions: ['1024x1024', '1920x1080', '1080x1920', '3840x2160'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5'],
  },
  {
    id: 'recraft-v3',
    name: 'Recraft V3 (Brand Assets & Vector Styling)',
    family: 'Recraft',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'image',
    description: 'Vector and brand-coherent design model with exact color-palette lock (HEX code adherence) and clean graphic iconography.',
    bestUsedFor: 'Promotional iconography, brand color palette enforcement, clean menu layout backgrounds, and vector illustrations.',
    capabilities: ['hex_color_lock', 'vector_styling', 'clean_layouts', 'brand_consistency'],
    knownFailureModes: [
      'Photorealism depth of field is flatter than pure photographic models like Soul.'
    ],
    failureMitigation: 'Use specifically for graphic design, print layout elements, and brand color anchoring.',
    unitCostUSD: 0.12,
    costUnit: 'per render',
    avgAttempts: 1.5,
    typicalQueueTimeSeconds: 8,
    supportedResolutions: ['1024x1024', '2048x2048'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '3:2'],
  },
  {
    id: 'higgsfield-dop-2.5',
    name: 'Higgsfield DoP 2.5 (Director of Photography)',
    family: 'Higgsfield DoP',
    provider: 'Higgsfield',
    role: 'CONTROL',
    category: 'motion',
    description: 'Deterministic camera trajectory engine offering Steadicam emulation, orbital 360 dollies, crane rises, and logarithmic zooms.',
    bestUsedFor: 'Controlling precise camera movements around hero products and architecture without drifting subject geometry.',
    capabilities: ['deterministic_camera', 'orbital_pushin', 'steadicam_physics', 'dolly_zoom'],
    knownFailureModes: [
      'Sudden extreme acceleration curves (>45 deg/sec) can warp background edges.',
      'Parallax distortion on deep foreground objects if focal length is under 24mm.'
    ],
    failureMitigation: 'Select 35mm-50mm prime lens profile and ease-in/ease-out logarithmic curve.',
    unitCostUSD: 1.60,
    costUnit: 'per 5s clip',
    avgAttempts: 1.8,
    typicalQueueTimeSeconds: 40,
    supportedResolutions: ['1080p', '4K UHD'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },

  // ==========================================
  // SHIP ROLE: Premium Client-Facing Outputs
  // ==========================================
  {
    id: 'bytedance-seedance-2.5',
    name: 'ByteDance Seedance 2.5 Master (Cinematic Video)',
    family: 'Seedance',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'video',
    description: 'Flagship video generation model featuring state-of-the-art fluid dynamics, atmospheric physics, and cinematic lighting.',
    bestUsedFor: 'Final client-facing hero commercials, luxury teasers, realistic smoke/water/steam dynamics, and high-coherence motion.',
    capabilities: ['cinematic_physics', 'fluid_dynamics', 'atmospheric_lighting', 'temporal_stability'],
    knownFailureModes: [
      'Rapid multi-person movement can occasionally cross limbs in crowded background scenes.',
      'Micro-camera vibration during long 5s static holds.'
    ],
    failureMitigation: 'Use approved keyframe seed from CONTROL phase; verify prompt contains clear foreground focus.',
    unitCostUSD: 1.50,
    costUnit: 'per 5s clip',
    avgAttempts: 2.2,
    typicalQueueTimeSeconds: 45,
    supportedResolutions: ['1080p', '4K UHD'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
    operation: 'text-to-video',
    accessRoute: 'Official SDK',
    exactModelId: 'bytedance/seedance-2.5/text-to-video',
    supportedInputs: ['prompt', 'duration', 'resolution', 'aspect_ratio'],
    quoteLabel: 'Verified Catalog Quote',
  },
  {
    id: 'kling-1.5-pro',
    name: 'Kling 1.5 Pro (Physics & Long Takes)',
    family: 'Kling',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'video',
    description: 'High-adherence video synthesis engine renowned for complex mechanical movements, human anatomy, and extended 5s/10s takes.',
    bestUsedFor: 'Complex physics, human movement sequences, mechanical machinery, and long-take narrative shots.',
    capabilities: ['complex_physics', 'long_takes', 'accurate_anatomy', 'mechanical_motion'],
    knownFailureModes: [
      'Can occasionally hallucinate or invent background text on storefronts/billboards.',
      'Camera trajectory can slow down unexpectedly in the final 2 seconds.'
    ],
    failureMitigation: 'Explicitly state "no background text" in negative prompt; plan for 0.5s head/tail trim in edit.',
    unitCostUSD: 1.80,
    costUnit: 'per 5s clip',
    avgAttempts: 2.0,
    typicalQueueTimeSeconds: 55,
    supportedResolutions: ['1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 10,
  },
  {
    id: 'google-veo-2',
    name: 'Google Veo 2 (Photorealistic Master)',
    family: 'Veo',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'video',
    description: 'Cinematic video model with strong natural lighting, dialogue pacing and photorealism.',
    bestUsedFor: 'Tier-1 luxury brand campaigns, film festivals, broadcast commercial TV spots, and high-ticket hero reels.',
    capabilities: ['photorealism', 'film_craft_optics', 'dialogue_pacing', 'environmental_coherence'],
    knownFailureModes: [
      'Higher queue latency during peak provider load (up to 3-4 minutes per clip).',
      'Premium unit cost ($2.20/5s) impacts gross margin on lower-budget jobs.'
    ],
    failureMitigation: 'Reserve for jobs with client budget > $2,000; ensure keyframe seed is fully approved before dispatch.',
    unitCostUSD: 2.20,
    costUnit: 'per 5s clip',
    avgAttempts: 1.8,
    typicalQueueTimeSeconds: 90,
    supportedResolutions: ['1080p', '4K UHD'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 8,
  },
  {
    id: 'higgsfield-soul-v2',
    name: 'Higgsfield Soul 2.0 HD (Fashion & Editorial Stills)',
    family: 'Soul',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'image',
    description: 'Premier human portrait, fashion, and editorial photography model with exceptional skin texture, lighting taste, and depth.',
    bestUsedFor: 'Hero keyframes, fashion and lifestyle imagery, chef portraits, and cinematic master key visuals.',
    capabilities: ['editorial_taste', 'fashion_mastery', 'human_portraits', 'photorealistic_skin'],
    knownFailureModes: [
      'Complex hand grips around delicate objects can take 2-3 seed variations.',
      'High ISO grain styling may need slight smoothing in FINISH stage if pristine studio look is desired.'
    ],
    failureMitigation: 'Select 3-4 seed batch; use Qwen Inpaint if finger placement needs micro-adjustment.',
    unitCostUSD: 0.22,
    costUnit: 'per render',
    avgAttempts: 2.4,
    typicalQueueTimeSeconds: 14,
    supportedResolutions: ['1920x1080', '3840x2160', '1080x1920'],
    supportedAspectRatios: ['16:9', '9:16', '4:5', '1:1'],
  },
  {
    id: 'minimax-video-01',
    name: 'MiniMax Video 01 (Hailuo Talking & Emotion)',
    family: 'MiniMax',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'video',
    description: 'Specialized video model with superior rendering of human facial micro-expressions, speech movement, and natural charisma.',
    bestUsedFor: 'Talking head clips, interview-style sequences, emotional human narratives, and UGC-style client testimonials.',
    capabilities: ['human_emotion', 'talking_characters', 'expressive_faces', 'natural_movement'],
    knownFailureModes: [
      'Background environment can undergo subtle drifting if camera movement is too intense.',
      'Slight eye blinks on fast pan.'
    ],
    failureMitigation: 'Keep camera relatively steady for talking head shots; lock background keyframe in prompt.',
    unitCostUSD: 1.40,
    costUnit: 'per 5s clip',
    avgAttempts: 2.0,
    typicalQueueTimeSeconds: 40,
    supportedResolutions: ['1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 6,
  },
  {
    id: 'wan-2.1-native-audio',
    name: 'Wan 2.1 Native Audio-Video Lane',
    family: 'Wan',
    provider: 'Higgsfield',
    role: 'SHIP',
    category: 'video',
    description: 'Joint audio-visual synthesis model generating synchronized ambient sound effects and Foley matching video action.',
    bestUsedFor: 'Scenes where sound effects (sizzling pan, car rev, ocean waves, footsteps) must match visual contact directly.',
    capabilities: ['synchronized_audio', 'foley_sound', 'native_ambient_sound'],
    knownFailureModes: [
      'Audio reverb can occasionally sound slightly boxy or wet in enclosed indoor spaces.'
    ],
    failureMitigation: 'Export audio track as isolated stem; apply light EQ high-pass filter in finishing.',
    unitCostUSD: 1.65,
    costUnit: 'per 5s clip',
    avgAttempts: 2.2,
    typicalQueueTimeSeconds: 45,
    supportedResolutions: ['1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 5,
  },

  // ==========================================
  // FINISH ROLE: Upscaling, Voice, Sync & QA
  // ==========================================
  {
    id: 'topaz-video-ai-pro',
    name: 'Topaz Video AI Pro (Neural Upscale & Interpolation)',
    family: 'Topaz',
    provider: 'Partner',
    role: 'FINISH',
    category: 'finishing',
    description: 'Industry-standard AI finishing tool for 4K/8K resolution upscaling, motion deblurring, 60fps frame interpolation, and film grain matching.',
    bestUsedFor: 'Master delivery upscaling, broadcast finishing, artifact cleanup, and framerate smoothing.',
    capabilities: ['4k_8k_upscale', 'motion_deblur', 'frame_interpolation', 'film_grain_match'],
    knownFailureModes: [
      'Over-sharpening halos around high-contrast edges if sharpness parameter exceeds 40%.',
      'Frame interpolation can create ghostly artifacts during rapid foreground occlusion.'
    ],
    failureMitigation: 'Cap deblur strength at 30% and use Iris face-recovery model for human subjects.',
    unitCostUSD: 0.90,
    costUnit: 'per render',
    avgAttempts: 1.2,
    typicalQueueTimeSeconds: 60,
    supportedResolutions: ['3840x2160', '7680x4320'],
    supportedAspectRatios: ['any'],
  },
  {
    id: 'bytedance-super-res-4k',
    name: 'ByteDance Neural Super-Resolution 4K',
    family: 'ByteDance',
    provider: 'Higgsfield',
    role: 'FINISH',
    category: 'finishing',
    description: 'Native Higgsfield 4K temporal super-resolution neural pass that enhances textures while preserving original lighting intentions.',
    bestUsedFor: 'Fast, cost-effective 4K upscaling directly within the Higgsfield cloud execution environment.',
    capabilities: ['native_cloud_upscale', 'texture_enhancement', 'temporal_consistency'],
    knownFailureModes: [
      'May slightly soften ultra-fine simulated 35mm grain if denoise is left at default 1.0.'
    ],
    failureMitigation: 'Set grain retention toggle to True for cinematic briefs.',
    unitCostUSD: 0.85,
    costUnit: 'per render',
    avgAttempts: 1.1,
    typicalQueueTimeSeconds: 35,
    supportedResolutions: ['3840x2160'],
    supportedAspectRatios: ['any'],
  },
  {
    id: 'elevenlabs-voice-studio',
    name: 'ElevenLabs Voice Studio Ultra',
    family: 'ElevenLabs',
    provider: 'Partner',
    role: 'FINISH',
    category: 'voice',
    description: 'Narrative voice synthesis with emotional range, realistic breath pauses and 24-bit 48kHz WAV output.',
    bestUsedFor: 'Cinematic brand voiceovers, documentary narrations, character dialogue, and promotional voice tracks.',
    capabilities: ['cinematic_voiceover', 'emotional_nuance', 'master_audio_48k', 'pacing_control'],
    knownFailureModes: [
      'Niche brand names or local Island dialects can be mispronounced without phonetic spelling guides.',
      'Extreme high-energy shouting can clip if output gain is uncompressed.'
    ],
    failureMitigation: 'Provide phonetic respelling in script input (e.g. "Ryde [R-EYE-D]") and enable master compression.',
    unitCostUSD: 0.35,
    costUnit: 'per 1k chars',
    avgAttempts: 1.3,
    typicalQueueTimeSeconds: 10,
    supportedResolutions: ['N/A'],
    supportedAspectRatios: ['N/A'],
  },
  {
    id: 'higgsfield-speak-lip-sync',
    name: 'Higgsfield Speak / Lip-Sync Pro',
    family: 'Higgsfield Speak',
    provider: 'Higgsfield',
    role: 'FINISH',
    category: 'finishing',
    description: 'Precision audio-to-video viseme alignment engine that morphs lip movements of synthetic characters to match spoken dialogue.',
    bestUsedFor: 'Adding spoken voiceover directly to synthetic character faces, multi-lingual localization, and talking spokesperson videos.',
    capabilities: ['audio_lip_sync', 'viseme_alignment', 'multilingual_dubbing'],
    knownFailureModes: [
      'Extreme side-profile head turns (>70 degrees) can cause mouth shape deformation.',
      'Rapid whispering can result in under-articulated jaw movement.'
    ],
    failureMitigation: 'Ensure input video has front-to-three-quarter facial framing during speaking segments.',
    unitCostUSD: 0.65,
    costUnit: 'per 5s clip',
    avgAttempts: 1.5,
    typicalQueueTimeSeconds: 30,
    supportedResolutions: ['1080p'],
    supportedAspectRatios: ['16:9', '9:16'],
    maxDurationSeconds: 15,
  },
  {
    id: 'subcaption-studio-export',
    name: 'SubCaption Studio AI (Kinetic Typography)',
    family: 'SubCaption',
    provider: 'Partner',
    role: 'FINISH',
    category: 'finishing',
    description: 'Social-first automated transcription and kinetic subtitle engine with word-by-word animation and 9:16 safe-zone enforcement.',
    bestUsedFor: 'Reels, TikTok cutdowns, and Instagram video spots where 80%+ of viewers watch with sound muted.',
    capabilities: ['kinetic_subtitles', 'word_highlight', 'safe_zone_framing', 'auto_transcription'],
    knownFailureModes: [
      'Heavy background music swells can occasionally obscure mumbled or fast speech.'
    ],
    failureMitigation: 'Pass the isolated voice stem rather than the full stereo mix to improve transcription accuracy, then proof-read captions.',
    unitCostUSD: 0.15,
    costUnit: 'per render',
    avgAttempts: 1.1,
    typicalQueueTimeSeconds: 15,
    supportedResolutions: ['1080x1920', '1920x1080'],
    supportedAspectRatios: ['9:16', '16:9'],
  },
];

/**
 * Helper to fetch a model from the capability catalog by its unique ID.
 */
export function getCatalogModelById(id: string): ModelCapabilityItem | null {
  return CAPABILITY_CATALOG.find(m => m.id === id) || null;
}

/**
 * Helper to list all models belonging to a specific production role.
 */
export function getModelsByRole(role: ProductionRole): ModelCapabilityItem[] {
  return CAPABILITY_CATALOG.filter(m => m.role === role);
}

/**
 * Find suitable alternatives for a given model within the same role or capability group.
 */
export function getModelAlternatives(modelId: string): ModelCapabilityItem[] {
  const current = getCatalogModelById(modelId);
  if (!current) return [];

  return CAPABILITY_CATALOG.filter(m =>
    m.id !== modelId &&
    (m.role === current.role || m.category === current.category)
  );
}
