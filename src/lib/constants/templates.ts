import { ProductizedServiceTemplate } from '@/types/autonomy';

export const PRODUCTIZED_SERVICE_TEMPLATES: ProductizedServiceTemplate[] = [
  {
    id: 'launch_video',
    name: 'Launch Video (Commercial Hero)',
    tagline: 'High-craft 15-second cinematic product reveal across landscape and vertical formats.',
    description: 'Turn a new product launch into an arresting commercial asset. Includes 15-second master video in 16:9 landscape and 9:16 vertical, 3 master still keyframes, 2 consolidated revision rounds, and 72-hour turnaround.',
    turnaroundHours: 72,
    fixedPriceUSD: 2400,
    maxProductionSpendUSD: 45,
    targetGrossMarginPct: 98,
    deliverablesSummary: [
      '1x 15-Second Hero Video (16:9 4K ProRes 422)',
      '1x 15-Second Vertical Cutdown (9:16 1080x1920 for Reels/TikTok)',
      '3x Master Commercial Stills (3840x2160)',
      '1x Studio Master Voiceover Track (24-bit 48kHz WAV)',
      '2x Consolidated Revision Rounds Included'
    ],
    requiredInputs: [
      'High-resolution packaging or bottle packshot (clean transparent PNG or 3D render)',
      'Brand logo in vector format (.SVG or .AI)',
      'Approved headline or voiceover script (under 35 words for 15s timing)',
      'Color palette or brand book guide',
      'Delivery deadline and designated human approver'
    ],
    acceptedFileTypes: ['.png', '.jpg', '.svg', '.ai', '.pdf', '.mp4'],
    modelRecipe: [
      {
        role: 'SEARCH',
        modelId: 'wan-2.1-fast',
        purpose: 'Rapid exploration of 6-8 kinetic camera hooks; operator selects top 2.',
        plannedAttempts: 8,
      },
      {
        role: 'CONTROL',
        modelId: 'bytedance-seedream-2',
        purpose: 'Lock product geometry, reflections, and label textures against reference assets.',
        plannedAttempts: 3,
      },
      {
        role: 'CONTROL',
        modelId: 'higgsfield-dop-2.5',
        purpose: 'Apply smooth orbital dolly-in camera trajectory pass.',
        plannedAttempts: 2,
      },
      {
        role: 'SHIP',
        modelId: 'bytedance-seedance-2.5',
        purpose: 'Synthesize master cinematic fluid dynamics, atmospheric mist, and lighting.',
        plannedAttempts: 3,
      },
      {
        role: 'CONTROL',
        modelId: 'qwen-image-edit-v2',
        purpose: 'Surgical repair pass for label typography and edge reflections.',
        plannedAttempts: 1,
      },
      {
        role: 'FINISH',
        modelId: 'elevenlabs-voice-studio',
        purpose: 'Record cinematic narrative voiceover with clean studio EQ.',
        plannedAttempts: 2,
      },
      {
        role: 'FINISH',
        modelId: 'topaz-video-ai-pro',
        purpose: 'Master 4K UHD neural upscaling, 35mm grain matching, and deblur.',
        plannedAttempts: 1,
      },
      {
        role: 'FINISH',
        modelId: 'subcaption-studio-export',
        purpose: 'Burn in styled kinetic captions for 9:16 vertical social cutdown.',
        plannedAttempts: 1,
      }
    ],
    qualityChecklist: [
      'Product geometry and label text match reference assets exactly with zero warping.',
      'Reflections and shadows respond physically to scene environment.',
      'Voiceover timing matches motion cuts with at least 0.8s tail pause.',
      'Vertical 9:16 crop respects Instagram/TikTok UI safe zones.',
      'No synthetic plastic artifacting; 35mm grain profile applied.'
    ],
    includedRevisions: 2,
    escalationConditions: [
      'Client requests human actor likeness without written signed release.',
      'Unclear product packaging claims (e.g. unverified medical or SPF claims).',
      'Revision feedback requests fundamental re-shoot of approved storyboard.',
      'Cumulative generation spend approaches 90% of max budget ceiling.'
    ]
  },
  {
    id: 'ugc_ad_pack',
    name: 'UGC Performance Ad Pack',
    tagline: '3 thumb-stopping hooks, 1 body narrative, and 3 high-converting social cutdowns.',
    description: 'Engineered for direct-response paid social campaigns. Delivers 3 distinct opening hook variations, 1 high-trust product demonstration body, kinetic animated captions, and 3 ready-to-test ad variants.',
    turnaroundHours: 48,
    fixedPriceUSD: 1650,
    maxProductionSpendUSD: 35,
    targetGrossMarginPct: 97,
    deliverablesSummary: [
      '3x Distinct Opening Hooks (0-3s high-contrast angles)',
      '1x Core Demonstration Body (10-12s solution narrative)',
      '3x Assembled Final Variations (9:16 1080x1920 MP4)',
      'Word-by-word kinetic animated subtitles',
      '1x Consolidated Revision Round Included'
    ],
    requiredInputs: [
      'Product packshot or sample video',
      'Key pain point and primary value proposition',
      '3 hook concepts or core client selling angles',
      'Brand primary color and font preference'
    ],
    acceptedFileTypes: ['.png', '.jpg', '.mp4', '.mov', '.pdf'],
    modelRecipe: [
      {
        role: 'SEARCH',
        modelId: 'wan-2.1-fast',
        purpose: 'Draft 6 rapid motion hooks testing opening movement speeds.',
        plannedAttempts: 6,
      },
      {
        role: 'CONTROL',
        modelId: 'higgsfield-marketing-studio',
        purpose: 'Staging clean table-top product demonstration visuals.',
        plannedAttempts: 2,
      },
      {
        role: 'SHIP',
        modelId: 'minimax-video-01',
        purpose: 'Synthesize expressive human creator presentation with natural micro-gestures.',
        plannedAttempts: 3,
      },
      {
        role: 'FINISH',
        modelId: 'elevenlabs-voice-studio',
        purpose: 'Energetic, authentic conversational voiceover.',
        plannedAttempts: 2,
      },
      {
        role: 'FINISH',
        modelId: 'subcaption-studio-export',
        purpose: 'Generate high-retention animated subtitles with yellow highlight styling.',
        plannedAttempts: 3,
      }
    ],
    qualityChecklist: [
      'Hook initiates motion and curiosity within first 1.5 seconds.',
      'Audio volume normalized to -14 LUFS standard for mobile social feeds.',
      'Subtitles checked against spoken audio: no visible word lag.',
      'CTA clear and uncluttered in final 3 seconds.'
    ],
    includedRevisions: 1,
    escalationConditions: [
      'Real person likeness used without explicit synthetic persona disclaimer.',
      'Client requests disparaging competitor trademark comparison.',
      'Change of product formula or pricing claim after generation start.'
    ]
  },
  {
    id: 'localization_pack',
    name: 'Localization Pack (5 Languages)',
    tagline: 'Adapt one approved master ad into 5 global markets with translated voice, graphics, and lip-sync.',
    description: 'Scales an approved master commercial across international markets. Translates on-screen text, re-synthesizes native voiceovers with authentic regional accents, aligns facial lip movements, and burns localized captions.',
    turnaroundHours: 96,
    fixedPriceUSD: 3200,
    maxProductionSpendUSD: 55,
    targetGrossMarginPct: 98,
    deliverablesSummary: [
      '5x Fully Localized Video Masters (Spanish, French, German, Italian, Japanese)',
      'Native Voiceover Tracks in each target language',
      'AI Viseme Lip-Sync Alignment for speaking on-camera talent',
      'Translated on-screen typography and product callouts',
      '1x Consolidated Revision Round per language'
    ],
    requiredInputs: [
      'Approved 4K master video plate with isolated audio stems (Dialogue, Music, SFX)',
      'Approved master script with timing markers',
      'Pronunciation guide for brand name across foreign languages',
      'Target country advertising compliance checklist'
    ],
    acceptedFileTypes: ['.mp4', '.mov', '.wav', '.pdf', '.docx'],
    modelRecipe: [
      {
        role: 'CONTROL',
        modelId: 'qwen-image-edit-v2',
        purpose: 'Inpaint and replace on-screen graphic text with translated language assets.',
        plannedAttempts: 5,
      },
      {
        role: 'FINISH',
        modelId: 'elevenlabs-voice-studio',
        purpose: 'Synthesize native speaker voiceover across 5 languages with regional inflection.',
        plannedAttempts: 6,
      },
      {
        role: 'FINISH',
        modelId: 'higgsfield-speak-lip-sync',
        purpose: 'Align synthetic mouth visemes to new translated language phonemes.',
        plannedAttempts: 5,
      },
      {
        role: 'FINISH',
        modelId: 'subcaption-studio-export',
        purpose: 'Burn in localized subtitle tracks with safe-zone positioning.',
        plannedAttempts: 5,
      },
      {
        role: 'FINISH',
        modelId: 'topaz-video-ai-pro',
        purpose: 'Master render export and artifact suppression.',
        plannedAttempts: 2,
      }
    ],
    qualityChecklist: [
      'Phonetic pronunciation of brand names approved for all 5 dialects.',
      'Lip-sync viseme alignment within 45ms of spoken vowel audio.',
      'Translated on-screen graphics fit bounding boxes without text clipping.',
      'Compliance with regional advertising guidelines checked.'
    ],
    includedRevisions: 1,
    escalationConditions: [
      'Regional regulatory restrictions on advertising claims (e.g. EU cosmetics rules).',
      'Untranslated slang requiring human linguist arbitration.',
      'Audio sync drift exceeding 150ms during lip-sync pass.'
    ]
  }
];

export function getTemplateById(id: string): ProductizedServiceTemplate | null {
  return PRODUCTIZED_SERVICE_TEMPLATES.find(t => t.id === id) || null;
}
