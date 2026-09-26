import {
  BriefAnalysis,
  Workflow,
  WorkflowStep,
  WorkflowStepStage,
  ProductionRole,
  ModelAlternative,
  Job,
} from '@/types';
import {
  CAPABILITY_CATALOG,
  ModelCapabilityItem,
  getCatalogModelById,
} from '../models/capability-catalog';
import {
  deriveJobSignals,
  selectControlModel,
  selectCameraModel,
  selectShipModel,
  selectVoiceModel,
  selectUpscaleModel,
} from './model-selection';

export class ModelRouter {
  /**
   * Transparently proposes a complete production route based on the client brief,
   * deliverable requirements, reference constraints, and margin targets.
   *
   * Enforces the production progression:
   * Generate 6-8 inexpensive concepts -> human chooses 2 -> make controlled keyframes
   * -> generate final motion -> repair continuity failure if needed -> upscale & audio -> QA.
   */
  static planRoute(analysis: BriefAnalysis, jobContext?: Partial<Job>): Workflow {
    const steps: WorkflowStep[] = [];
    let order = 1;

    // Detect project characteristics (shared with DeterministicEvaluator so pricing matches the plan)
    const signals = deriveJobSignals(analysis, { rawBrief: jobContext?.rawBrief, budget: jobContext?.budget });
    const { deliverables, isVideoProject, needsSocialCaptions, hasVoiceRequirement, isTalkingOrInterview } = signals;

    // =========================================================================
    // STEP 1: SEARCH ROLE (Rapid Concept Exploration: 8 Concepts -> Choose 2)
    // =========================================================================
    const searchModel = isVideoProject
      ? (getCatalogModelById('wan-2.1-fast') || getCatalogModelById('flux-schnell')!)
      : getCatalogModelById('flux-schnell')!;

    const searchAlt = getCatalogModelById('seedance-fast') || getCatalogModelById('pixverse-v3-fast')!;
    const searchAttempts = 8;
    const searchUnitCost = searchModel.unitCostUSD;
    const searchTotal = Number((searchAttempts * searchUnitCost).toFixed(2));

    steps.push({
      id: `step-${order}`,
      order: order++,
      name: isVideoProject
        ? 'Rapid Motion Search: 8 Hook Concepts (Operator Chooses 2)'
        : 'Rapid Aesthetic Search: 8 Visual Concepts (Operator Chooses 2)',
      stage: 'Concept & Keyframe',
      role: 'SEARCH',
      selectedModel: searchModel.name,
      selectedModelId: searchModel.id,
      whyItFits: `Inexpensive sub-second exploration allows generating 8 broad visual hooks/framings for only $${searchTotal} total. The human operator selects the top 2 candidates before committing paid GPU budget to high-fidelity motion.`,
      knownFailureMode: searchModel.knownFailureModes[0],
      failureMitigation: searchModel.failureMitigation,
      alternativeModel: {
        id: searchAlt.id,
        name: searchAlt.name,
        unitCost: searchAlt.unitCostUSD,
        reason: 'Slightly higher per-clip cost but provides tighter camera motion fidelity if fast kinetic pacing is essential.',
        tradeoff: `+$${((searchAlt.unitCostUSD - searchModel.unitCostUSD) * searchAttempts).toFixed(2)} total spend for higher action adherence.`,
      },
      availableAlternatives: [
        this.toModelAlternative(searchAlt, 'Higher camera speed fidelity'),
        this.toModelAlternative(getCatalogModelById('pixverse-v3-fast')!, 'Kinetic vehicle & sports action test'),
        this.toModelAlternative(getCatalogModelById('flux-schnell')!, 'Lowest cost image-only moodboards ($0.05/render)'),
      ],
      purpose: 'Generate 8 inexpensive concept variants exploring composition, camera angle, and lighting. Human operator selects top 2 seeds.',
      inputs: {
        batchSize: 8,
        prompt: `Exploratory concepts: ${analysis.conciseSummary}. Cinematic framing, dynamic lighting options.`,
        aspectRatio: deliverables[0]?.aspectRatio || '16:9',
        resolution: '720p',
      },
      expectedOutputs: '8 rough concept variants; operator selects 2 winners to lock into the CONTROL phase.',
      estimatedAttempts: searchAttempts,
      unitCost: searchUnitCost,
      estimatedTotalCost: searchTotal,
      maxAuthorizedSpend: Number((searchTotal * 1.2).toFixed(2)),
      queueEstimateSeconds: searchModel.typicalQueueTimeSeconds,
      status: 'Pending Approval',
    });

    // =========================================================================
    // STEP 2: CONTROL ROLE (Product / Identity / Packaging Keyframes)
    // =========================================================================
    const { model: controlModel, reason: controlReason } = selectControlModel(signals);

    const controlAlt = signals.hasProductReference
      ? getCatalogModelById('higgsfield-marketing-studio')!
      : getCatalogModelById('qwen-image-edit-v2')!;
    const controlAttempts = 3;
    const controlTotal = Number((controlAttempts * controlModel.unitCostUSD).toFixed(2));

    steps.push({
      id: `step-${order}`,
      order: order++,
      name: `Controlled Master Keyframes (${controlModel.family} Geometry & Reference Lock)`,
      stage: 'Concept & Keyframe',
      role: 'CONTROL',
      selectedModel: controlModel.name,
      selectedModelId: controlModel.id,
      whyItFits: controlReason,
      knownFailureMode: controlModel.knownFailureModes[0],
      failureMitigation: controlModel.failureMitigation,
      alternativeModel: {
        id: controlAlt.id,
        name: controlAlt.name,
        unitCost: controlAlt.unitCostUSD,
        reason: 'Strong alternative for isolated packshots or direct surgical element inpainting.',
        tradeoff: 'Slightly more clinical studio look; typically less geometry drift on packaging labels. Check labels at delivery size.',
      },
      availableAlternatives: [
        this.toModelAlternative(controlAlt, 'Surgical packshot isolation'),
        this.toModelAlternative(getCatalogModelById('higgsfield-marketing-studio')!, 'Studio e-commerce table-top staging'),
        this.toModelAlternative(getCatalogModelById('higgsfield-soul-v2')!, 'Fashion portrait & skin texture specialist'),
      ],
      purpose: 'Generate 2-3 locked, color-graded master keyframe plates preserving client reference geometry and lighting.',
      inputs: {
        aspectRatio: deliverables[0]?.aspectRatio || '16:9',
        resolution: '3840x2160',
        referenceAssets: analysis.suppliedAssets || [],
        lightingStyle: 'Commercial master grade, 35mm anamorphic prime lens, physical bounce light',
      },
      expectedOutputs: '2 locked master keyframe plates to serve as the visual anchor for downstream motion.',
      estimatedAttempts: controlAttempts,
      unitCost: controlModel.unitCostUSD,
      estimatedTotalCost: controlTotal,
      maxAuthorizedSpend: Number((controlTotal * 1.3).toFixed(2)),
      queueEstimateSeconds: controlModel.typicalQueueTimeSeconds,
      status: 'Pending Approval',
    });

    // =========================================================================
    // STEP 3: CONTROL ROLE (Camera Trajectory Pass - for Video Deliverables)
    // =========================================================================
    if (isVideoProject) {
      const dopModel = selectCameraModel().model;
      const dopAlt = getCatalogModelById('seedance-fast')!;
      const dopAttempts = 2;
      const dopTotal = Number((dopAttempts * dopModel.unitCostUSD).toFixed(2));

      steps.push({
        id: `step-${order}`,
        order: order++,
        name: 'Deterministic Camera Choreography (Higgsfield DoP 2.5)',
        stage: 'Camera Motion / DoP',
        role: 'CONTROL',
        selectedModel: dopModel.name,
        selectedModelId: dopModel.id,
        whyItFits: 'Enforces repeatable physical camera trajectories (orbital push-in, Steadicam tracking, crane tilt) without warping the locked subject keyframe.',
        knownFailureMode: dopModel.knownFailureModes[0],
        failureMitigation: dopModel.failureMitigation,
        alternativeModel: {
          id: dopAlt.id,
          name: dopAlt.name,
          unitCost: dopAlt.unitCostUSD,
          reason: 'Lower cost camera motion lane for simpler linear dolly shots.',
          tradeoff: 'Saves ~$1.10 per attempt, but offers less precise mathematical Steadicam stabilization.',
        },
        availableAlternatives: [
          this.toModelAlternative(dopAlt, 'Faster, lower-cost linear dolly movement'),
          this.toModelAlternative(getCatalogModelById('pixverse-v3-fast')!, 'High-velocity whip-pan and kinetic camera movement'),
        ],
        purpose: 'Apply smooth orbital dolly-in camera motion to the locked keyframe plate.',
        inputs: {
          cameraMovement: 'Slow logarithmic push-in with 20-degree orbital pan',
          focalLength: '50mm commercial prime',
          stabilization: 'Steadicam mechanical rig emulation',
        },
        expectedOutputs: 'Stabilized 5-second camera trajectory motion plates.',
        estimatedAttempts: dopAttempts,
        unitCost: dopModel.unitCostUSD,
        estimatedTotalCost: dopTotal,
        maxAuthorizedSpend: Number((dopTotal * 1.25).toFixed(2)),
        queueEstimateSeconds: dopModel.typicalQueueTimeSeconds,
        status: 'Pending Approval',
      });
    }

    // =========================================================================
    // STEP 4: SHIP ROLE (Final High-Fidelity Client-Facing Asset Synthesis)
    // =========================================================================
    const { model: shipModel, reason: shipReason } = selectShipModel(signals);

    const shipAlt = isVideoProject
      ? (getCatalogModelById('kling-1.5-pro') || getCatalogModelById('google-veo-2')!)
      : (getCatalogModelById('bytedance-seedream-2') || getCatalogModelById('ideogram-v2.5')!);
    const shipAttempts = 3;
    const shipTotal = Number((shipAttempts * shipModel.unitCostUSD).toFixed(2));

    steps.push({
      id: `step-${order}`,
      order: order++,
      name: isVideoProject
        ? `Final Cinematic Motion Synthesis (${shipModel.family} Master)`
        : `Master Hero Asset Rendering (${shipModel.family} HD)`,
      stage: isVideoProject ? 'Cinematic Video Gen' : 'Concept & Keyframe',
      role: 'SHIP',
      selectedModel: shipModel.name,
      selectedModelId: shipModel.id,
      whyItFits: shipReason,
      knownFailureMode: shipModel.knownFailureModes[0],
      failureMitigation: shipModel.failureMitigation,
      alternativeModel: {
        id: shipAlt.id,
        name: shipAlt.name,
        unitCost: shipAlt.unitCostUSD,
        reason: isVideoProject
          ? 'Kling 1.5 Pro is the preferred backup if complex multi-character limb interactions or 10-second long takes are needed.'
          : 'Seedream 2.0 usually holds packaging geometry more tightly if artwork must stay aligned to the supplied files.',
        tradeoff: `Difference of $${(shipAlt.unitCostUSD - shipModel.unitCostUSD).toFixed(2)} per attempt; switch if physics simulation needs alternative engine.`,
      },
      availableAlternatives: [
        this.toModelAlternative(shipAlt, 'Complex physics & extended duration takes'),
        this.toModelAlternative(getCatalogModelById('google-veo-2')!, 'Photorealistic broadcast look ($2.20/5s)'),
        this.toModelAlternative(getCatalogModelById('wan-2.1-native-audio')!, 'Native synchronized audio + motion ($1.65/5s)'),
      ],
      purpose: isVideoProject
        ? 'Synthesize final 5-second cinematic motion sequences with realistic physics and atmospheric lighting.'
        : 'Render final high-resolution deliverable master.',
      inputs: {
        fps: 24,
        coherenceWeight: 0.88,
        temporalConsistency: 'High',
        scenePrompts: `${analysis.conciseSummary}. Macro surface texture, cinematic motion, master color grading.`,
      },
      expectedOutputs: 'Master generative motion shots ready for surgical review, repair, and finishing.',
      estimatedAttempts: shipAttempts,
      unitCost: shipModel.unitCostUSD,
      estimatedTotalCost: shipTotal,
      maxAuthorizedSpend: Number((shipTotal * 1.35).toFixed(2)),
      queueEstimateSeconds: shipModel.typicalQueueTimeSeconds,
      status: 'Pending Approval',
    });

    // =========================================================================
    // STEP 5: CONTROL ROLE (Surgical Repair / Continuity Fallback)
    // =========================================================================
    const repairModel = getCatalogModelById('qwen-image-edit-v2')!;
    const repairAlt = getCatalogModelById('ideogram-v2.5')!;
    const repairAttempts = 1;
    const repairTotal = Number((repairAttempts * repairModel.unitCostUSD).toFixed(2));

    steps.push({
      id: `step-${order}`,
      order: order++,
      name: 'Continuity & Packaging Repair Pass (Qwen Surgical Inpaint)',
      stage: 'Concept & Keyframe',
      role: 'CONTROL',
      selectedModel: repairModel.name,
      selectedModelId: repairModel.id,
      whyItFits: 'Provides a designated safety repair gate to touch up any label drift, minor artifacting, or hand flaws without re-rendering expensive 5-second video passes.',
      knownFailureMode: repairModel.knownFailureModes[0],
      failureMitigation: repairModel.failureMitigation,
      alternativeModel: {
        id: repairAlt.id,
        name: repairAlt.name,
        unitCost: repairAlt.unitCostUSD,
        reason: 'Use Ideogram 2.5 if repair specifically involves re-rendering typographic text or slogans.',
        tradeoff: 'Ideogram handles text better but has broader inpainting boundary feathering.',
      },
      availableAlternatives: [
        this.toModelAlternative(repairAlt, 'Typographic headline repair'),
        this.toModelAlternative(getCatalogModelById('recraft-v3')!, 'Brand logo vector alignment'),
      ],
      purpose: 'Targeted repair pass for label typography, shot continuity and edge clean-up. Review: labels legible at delivery size, no continuity breaks between shots.',
      inputs: {
        inpaintFeatherPx: 14,
        preservationMask: 'Client logo and packaging label bounding box',
      },
      expectedOutputs: '1 repaired master plate, checked by the operator against the brand guidelines.',
      estimatedAttempts: repairAttempts,
      unitCost: repairModel.unitCostUSD,
      estimatedTotalCost: repairTotal,
      maxAuthorizedSpend: Number((repairTotal * 1.5).toFixed(2)),
      queueEstimateSeconds: repairModel.typicalQueueTimeSeconds,
      status: 'Pending Approval',
    });

    // =========================================================================
    // STEP 6: FINISH ROLE (Audio / Voiceover Synthesis - if needed)
    // =========================================================================
    if (hasVoiceRequirement) {
      const voiceModel = selectVoiceModel(signals).model;
      const voiceAlt = getCatalogModelById('wan-2.1-native-audio')!;
      const voiceAttempts = 2;
      const voiceTotal = Number((voiceAttempts * voiceModel.unitCostUSD).toFixed(2));

      steps.push({
        id: `step-${order}`,
        order: order++,
        name: isTalkingOrInterview
          ? 'Character Voice & Viseme Lip-Sync (Higgsfield Speak Pro)'
          : 'Broadcast Master Voiceover (ElevenLabs Ultra)',
        stage: 'Voice & Audio',
        role: 'FINISH',
        selectedModel: voiceModel.name,
        selectedModelId: voiceModel.id,
        whyItFits: isTalkingOrInterview
          ? 'Precisely aligns synthetic mouth visemes with the vocal track for realistic dialogue.'
          : 'Generates warm, broadcast-grade narrative voiceover with natural pacing, micro-breaths, and studio EQ.',
        knownFailureMode: voiceModel.knownFailureModes[0],
        failureMitigation: voiceModel.failureMitigation,
        alternativeModel: {
          id: voiceAlt.id,
          name: voiceAlt.name,
          unitCost: voiceAlt.unitCostUSD,
          reason: 'Native Wan 2.1 audio lane generates synchronized ambient environmental foley alongside the scene.',
          tradeoff: 'Provides ambient sound effects directly, but voiceover inflection has slightly less range than ElevenLabs.',
        },
        availableAlternatives: [
          this.toModelAlternative(voiceAlt, 'Native synchronized foley and sound effects'),
          this.toModelAlternative(getCatalogModelById('elevenlabs-voice-studio')!, 'Studio vocal narration master track'),
        ],
        purpose: 'Synthesize master vocal audio track matching video pacing and deliverable length.',
        inputs: {
          script: analysis.exactText?.[0] || deliverables[0]?.exactTextRequirements?.[0] || 'From the quiet coast, crafted with passion. Pure quality.',
          format: '48kHz 24-bit Broadcast WAV',
        },
        expectedOutputs: 'Master voice audio file ready for final mix and master cut.',
        estimatedAttempts: voiceAttempts,
        unitCost: voiceModel.unitCostUSD,
        estimatedTotalCost: voiceTotal,
        maxAuthorizedSpend: Number((voiceTotal * 1.3).toFixed(2)),
        queueEstimateSeconds: voiceModel.typicalQueueTimeSeconds,
        status: 'Pending Approval',
      });
    }

    // =========================================================================
    // STEP 7: FINISH ROLE (Neural Upscale & 4K Master Export)
    // =========================================================================
    const upscaleModel = selectUpscaleModel().model;
    const upscaleAlt = getCatalogModelById('bytedance-super-res-4k')!;
    const upscaleAttempts = 1;
    const upscaleTotal = Number((upscaleAttempts * upscaleModel.unitCostUSD).toFixed(2));

    steps.push({
      id: `step-${order}`,
      order: order++,
      name: `Neural 4K Master Upscale & Denoise (${upscaleModel.family})`,
      stage: 'Finishing & Upscaling',
      role: 'FINISH',
      selectedModel: upscaleModel.name,
      selectedModelId: upscaleModel.id,
      whyItFits: 'Executes temporal super-resolution to 4K UHD (3840x2160), motion deblurring, and subtle 35mm grain matching to eliminate any digital plastic look.',
      knownFailureMode: upscaleModel.knownFailureModes[0],
      failureMitigation: upscaleModel.failureMitigation,
      alternativeModel: {
        id: upscaleAlt.id,
        name: upscaleAlt.name,
        unitCost: upscaleAlt.unitCostUSD,
        reason: 'ByteDance native super-resolution runs directly in cloud without external render queues.',
        tradeoff: 'Saves ~$0.05 per render and finishes 25 seconds faster in pipeline.',
      },
      availableAlternatives: [
        this.toModelAlternative(upscaleAlt, 'Native cloud super-resolution (faster turnaround)'),
      ],
      purpose: 'Deliver clean 4K UHD master with 10-bit color depth and natural film grain.',
      inputs: {
        targetResolution: deliverables[0]?.resolution || '3840x2160',
        denoiseStrength: 0.35,
        grainMatching: '35mm Kodak 5207 emulation',
      },
      expectedOutputs: '4K master export compliant with client delivery specs.',
      estimatedAttempts: upscaleAttempts,
      unitCost: upscaleModel.unitCostUSD,
      estimatedTotalCost: upscaleTotal,
      maxAuthorizedSpend: Number((upscaleTotal * 1.2).toFixed(2)),
      queueEstimateSeconds: upscaleModel.typicalQueueTimeSeconds,
      status: 'Pending Approval',
    });

    // =========================================================================
    // STEP 8: FINISH ROLE (Social Captions & Safe-Zone Cutdowns - if vertical)
    // =========================================================================
    if (needsSocialCaptions) {
      const captionModel = getCatalogModelById('subcaption-studio-export')!;
      const captionAttempts = 1;
      const captionTotal = Number((captionAttempts * captionModel.unitCostUSD).toFixed(2));

      steps.push({
        id: `step-${order}`,
        order: order++,
        name: 'Kinetic Social Captions & 9:16 Vertical Safe-Zone Framing',
        stage: 'Finishing & Upscaling',
        role: 'FINISH',
        selectedModel: captionModel.name,
        selectedModelId: captionModel.id,
        whyItFits: '80%+ of social video views occur with audio muted. Automatically burns in styled kinetic subtitles positioned safely inside Instagram/TikTok UI bounds.',
        knownFailureMode: captionModel.knownFailureModes[0],
        failureMitigation: captionModel.failureMitigation,
        purpose: 'Generate 9:16 vertical cutdowns with animated captions for Reels and TikTok.',
        inputs: {
          aspectRatio: '9:16',
          safeZonePaddingPct: 15,
          fontStyle: 'Modern Bold Sans with yellow keyword highlight',
        },
        expectedOutputs: 'Social-ready 9:16 vertical MP4 cutdown.',
        estimatedAttempts: captionAttempts,
        unitCost: captionModel.unitCostUSD,
        estimatedTotalCost: captionTotal,
        maxAuthorizedSpend: Number((captionTotal * 1.2).toFixed(2)),
        queueEstimateSeconds: captionModel.typicalQueueTimeSeconds,
        status: 'Pending Approval',
      });
    }

    // Calculate total workflow estimated cost
    const totalEstimatedCost = Number(
      steps.reduce((acc, step) => acc + (step.estimatedTotalCost || 0), 0).toFixed(2)
    );

    // Calculate sensible initial spend limit ceiling (estimated + 25% buffer)
    const proposedCeiling = Number((totalEstimatedCost * 1.25).toFixed(2));

    return {
      id: `wf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      jobId: analysis.jobId,
      steps,
      totalEstimatedCost,
      approvalStatus: 'Pending Human Approval',
      maxApprovedSpend: proposedCeiling,
      notes: `Transparent Model Route proposed by Studio Operator based on ${analysis.jobType}. Human operator approval required before running initial paid workflow or committing GPU spend.`,
    };
  }

  /**
   * Allows the human operator to manually override any step with an alternative model,
   * instantly recalculating the unit cost, step cost, total workflow spend, and why-it-fits metadata.
   */
  static overrideStepModel(
    workflow: Workflow,
    stepId: string,
    newModelId: string,
    customAttempts?: number
  ): Workflow {
    const targetModel = getCatalogModelById(newModelId);
    if (!targetModel) {
      throw new Error(`Model ${newModelId} not found in the Higgsfield capability catalog.`);
    }

    const updatedSteps = workflow.steps.map(step => {
      if (step.id !== stepId) return step;

      const attempts = customAttempts ?? step.estimatedAttempts;
      const unitCost = targetModel.unitCostUSD;
      const stepTotal = Number((attempts * unitCost).toFixed(2));

      return {
        ...step,
        selectedModel: targetModel.name,
        selectedModelId: targetModel.id,
        role: targetModel.role,
        unitCost,
        estimatedAttempts: attempts,
        estimatedTotalCost: stepTotal,
        maxAuthorizedSpend: Number((stepTotal * 1.25).toFixed(2)),
        whyItFits: `[Manual Override by Operator] Replaced with ${targetModel.name}. ${targetModel.bestUsedFor}`,
        knownFailureMode: targetModel.knownFailureModes[0],
        failureMitigation: targetModel.failureMitigation,
        queueEstimateSeconds: targetModel.typicalQueueTimeSeconds,
        isOverridden: true,
        originalModel: step.originalModel || step.selectedModel,
      };
    });

    const newTotalSpend = Number(
      updatedSteps.reduce((acc, s) => acc + (s.estimatedTotalCost || 0), 0).toFixed(2)
    );

    return {
      ...workflow,
      steps: updatedSteps,
      totalEstimatedCost: newTotalSpend,
      maxApprovedSpend: Number((newTotalSpend * 1.25).toFixed(2)),
      notes: `${workflow.notes || ''} [Step ${stepId} overridden to ${targetModel.name}]`.trim(),
    };
  }

  private static toModelAlternative(model: ModelCapabilityItem, reason: string): ModelAlternative {
    return {
      id: model.id,
      name: model.name,
      unitCost: model.unitCostUSD,
      reason,
      tradeoff: `$${model.unitCostUSD} ${model.costUnit} (${model.typicalQueueTimeSeconds}s queue)`,
    };
  }
}
