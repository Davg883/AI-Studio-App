import {
  BriefAnalysisSchema,
  OPENAI_BRIEF_ANALYSIS_JSON_SCHEMA,
  validateBriefAnalysis,
  ValidatedBriefAnalysis,
} from '../schemas/brief-analysis-schema';
import { StructuredBriefAnalysis, JobSource, Job } from '@/types';
import { DeterministicEvaluator } from './deterministic-evaluator';

export interface BriefAnalysisInput {
  jobId: string;
  rawBrief: string;
  budget: number;
  deadline: string;
  source: JobSource;
  clientNotes?: string;
  referenceAssets?: Job['referenceAssets'];
  channelFeePct?: number;
  contingencyPct?: number;
}

export class AIAnalyzer {
  /**
   * Analyzes brief using OpenAI Responses API / model 'gpt-6-astra' with Structured Outputs,
   * followed by deterministic cost calculation and business rule enforcement.
   */
  static async analyze(input: BriefAnalysisInput): Promise<StructuredBriefAnalysis> {
    const isMock = process.env.MOCK_MODE === 'true' || !process.env.OPENAI_API_KEY;

    let validatedData: ValidatedBriefAnalysis;
    let modelUsed = 'gpt-6-astra (Engine Simulated Mock)';

    if (!isMock && process.env.OPENAI_API_KEY) {
      try {
        const liveResult = await this.callAstraStructuredApi(input);
        validatedData = liveResult.data;
        modelUsed = liveResult.model;
      } catch (err: any) {
        console.warn('OpenAI gpt-6-astra API call failed, falling back to simulated engine:', err?.message || err);
        validatedData = this.generateRealisticMockData(input);
        modelUsed = 'gpt-6-astra (Simulated Fallback)';
      }
    } else {
      validatedData = this.generateRealisticMockData(input);
    }

    // Run deterministic rules and catalog pricing over the validated Astra output
    const evalResult = DeterministicEvaluator.evaluate(
      {
        budget: input.budget,
        deadline: input.deadline,
        source: input.source,
        channelFeePct: input.channelFeePct ?? 10,
        contingencyPct: input.contingencyPct ?? 15,
        referenceAssets: input.referenceAssets || [],
        rawBrief: input.rawBrief,
      },
      validatedData
    );

    // Prepare full StructuredBriefAnalysis with backward-compatible adapters
    const result: StructuredBriefAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      jobId: input.jobId,
      jobType: validatedData.jobType,
      conciseSummary: validatedData.conciseSummary,
      deliverables: validatedData.deliverables,
      suppliedAssets: validatedData.suppliedAssets,
      missingAssets: validatedData.missingAssets,
      questionsForClient: validatedData.questionsForClient,
      brandConstraints: validatedData.brandConstraints,
      rightsAndConsentFlags: validatedData.rightsAndConsentFlags,
      technicalRisks: validatedData.technicalRisks,
      revisionRisk: validatedData.revisionRisk,
      confidence: validatedData.confidence,
      decision: evalResult.decision, // Deterministic decision takes precedence
      decisionReasons: [...evalResult.reasons, ...validatedData.decisionReasons],
      proposedWorkflow: validatedData.proposedWorkflow,
      estimatedAttemptsByStep: validatedData.estimatedAttemptsByStep,
      assumptions: validatedData.assumptions,

      // Deterministic calculation results
      deterministicDecision: evalResult.decision,
      deterministicReasons: evalResult.reasons,
      calculatedProductionCost: evalResult.calculatedProductionCost,
      calculatedGrossMargin: evalResult.expectedGrossMargin,
      calculatedMarginPct: evalResult.expectedMarginPct,

      // Metadata
      modelUsed,
      analyzedAt: new Date().toISOString(),

      // Backward compatibility fields for legacy UI views
      dimensions: Array.from(new Set(validatedData.deliverables.map(d => `${d.aspectRatio} (${d.resolution})`))),
      durations: validatedData.deliverables.map(d => d.durationSeconds > 0 ? `${d.durationSeconds}s` : 'Still'),
      references: validatedData.suppliedAssets,
      exactText: validatedData.deliverables.flatMap(d => d.exactTextRequirements),
      missingInformation: validatedData.missingAssets,
      rightsConcerns: validatedData.rightsAndConsentFlags.map((rc, idx) => ({
        id: `rc-${idx + 1}`,
        severity: rc.severity,
        issue: rc.flag,
        mitigation: rc.details,
        requiresApproval: rc.severity === 'high' || rc.severity === 'medium',
        approved: false,
      })),
      rationale: evalResult.reasons.join(' '),
    };

    return result;
  }

  /**
   * Calls OpenAI Responses / Chat Completions API with model 'gpt-6-astra' and strict JSON schema.
   */
  private static async callAstraStructuredApi(
    input: BriefAnalysisInput
  ): Promise<{ data: ValidatedBriefAnalysis; model: string }> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.ASTRA_API_BASE_URL || 'https://api.openai.com/v1';
    const modelToUse = process.env.ASTRA_MODEL || 'gpt-6-astra';

    const systemPrompt = `You are GPT-6 Astra, an elite creative director and AI pipeline strategist for a top-tier one-person commercial generative studio.
Turn the following client brief into structured requirements adhering strictly to the provided JSON Schema.

IMPORTANT OPERATIONAL RULES:
1. Do NOT invent model prices or endpoints in your output. You only specify the abstract "capabilityNeeded" (e.g. "keyframe_generation", "camera_motion", "video_scene_synthesis", "voiceover_synthesis", "neural_upscale_grade"). Prices are determined deterministically by the studio catalog.
2. In "estimatedAttemptsByStep", estimate how many generation attempts (typically 1 to 5) will be realistically needed for commercial sign-off for each step.
3. Flag any rights, likeness, trademark, soundalike music, deceptive impersonation, or factual claim risks in "rightsAndConsentFlags".
4. Recommend "accept" only for jobs with a clear deliverable, enough reference material, a plausible deadline, and room for healthy margin.
5. Recommend "human_review" when exact logos, packaging text, real person likeness/voice, factual claims, licensed music, or unclear rights are involved.
6. Recommend "reject" for work that cannot be delivered reliably or work that requires deceptive impersonation.`;

    const userContent = `Client Inbound Brief:
Source: ${input.source}
Budget: $${input.budget}
Deadline: ${input.deadline}
Client Notes: ${input.clientNotes || 'None'}
Attached References: ${JSON.stringify(input.referenceAssets || [])}

Raw Verbatim Brief:
"""
${input.rawBrief}
"""`;

    const payload = {
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'brief_analysis',
          strict: true,
          schema: OPENAI_BRIEF_ANALYSIS_JSON_SCHEMA,
        },
      },
      temperature: 0.1,
    };

    let response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // If gpt-6-astra is not yet available in current standard OpenAI public accounts, fallback to gpt-4o with strict schema
    if (!response.ok && modelToUse === 'gpt-6-astra') {
      console.warn('gpt-6-astra gateway responded with status ' + response.status + ', retrying with gpt-4o structured outputs fallback...');
      payload.model = 'gpt-4o';
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const responseJson = await response.json();
    const message = responseJson.choices?.[0]?.message;

    if (!message?.content) {
      throw new Error('Malformed OpenAI response: choices[0].message.content was empty.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message.content);
    } catch (parseError: any) {
      throw new Error(`Malformed JSON response from model: ${parseError.message}`);
    }

    // Validate using Zod
    const validation = validateBriefAnalysis(parsed);
    if (!validation.success || !validation.data) {
      throw new Error(`Schema validation failed on model output: ${validation.errors?.join(', ')}`);
    }

    return {
      data: validation.data,
      model: responseJson.model || modelToUse,
    };
  }

  /**
   * Generates realistic, fully compliant mock analysis data when running in MOCK_MODE
   * or when OPENAI_API_KEY is omitted. Strictly validated against BriefAnalysisSchema.
   */
  static generateRealisticMockData(input: BriefAnalysisInput): ValidatedBriefAnalysis {
    const text = (input.rawBrief + ' ' + (input.clientNotes || '')).toLowerCase();
    const budget = input.budget;

    // Detect job type
    let jobType = 'cinematic_concept_film';
    let conciseSummary = 'High-concept cinematic teaser featuring photorealistic visual worldbuilding and camera choreography.';
    let deliverables: ValidatedBriefAnalysis['deliverables'] = [];
    let proposedWorkflow: ValidatedBriefAnalysis['proposedWorkflow'] = [];
    let estimatedAttempts: Record<string, number> = {};

    if (text.includes('perfume') || text.includes('aethelgard') || text.includes('luxury') || text.includes('fragrance')) {
      jobType = 'luxury_concept_film';
      conciseSummary = 'Flagship 45-second cinematic concept teaser for luxury fragrance featuring brutalist volcanic landscapes, liquid glass physics, and deep narrative voiceover.';
      deliverables = [
        {
          name: 'Hero Narrative Concept Teaser',
          type: 'Hero Commercial Video',
          format: 'ProRes 422 HQ / MP4 H.265',
          aspectRatio: '16:9',
          durationSeconds: 45,
          resolution: '3840x2160 (4K UHD)',
          exactTextRequirements: ['"From the ash of stillness, presence is born."', '"Aethelgard: The Obsidian Horizon"'],
          description: 'Photorealistic multi-shot narrative sequence with orbital camera choreography and macro liquid glass physics.',
        },
        {
          name: 'Social Vertical Cutdown',
          type: 'Vertical Hook Cutdown',
          format: 'MP4 H.265',
          aspectRatio: '9:16',
          durationSeconds: 15,
          resolution: '1080x1920 (FHD)',
          exactTextRequirements: ['"From the ash of stillness, presence is born."'],
          description: 'High-energy hook cutdown optimized for mobile feed retention.',
        },
      ];
      proposedWorkflow = [
        { stepName: 'Hero Keyframes', capabilityNeeded: 'keyframe_generation', purpose: 'Establish photorealistic master visual anchor frames of basalt flacon rising from liquid glass.' },
        { stepName: 'DoP Camera Motion', capabilityNeeded: 'camera_motion', purpose: 'Execute 360-degree orbital push-in around the flacon with mechanical steadicam smoothness.' },
        { stepName: 'Video Scene Synthesis', capabilityNeeded: 'video_scene_synthesis', purpose: 'Synthesize iridescent liquid glass droplets running down obsidian surface with photorealistic refraction.' },
        { stepName: 'Voiceover Synthesis', capabilityNeeded: 'voiceover_synthesis', purpose: 'Synthesize deep, poetic British voiceover reciting manifesto line with pristine acoustic room tone.' },
        { stepName: 'Neural Master 4K', capabilityNeeded: 'neural_upscale_grade', purpose: 'Apply temporal de-flicker, 4K master grade, subtle Kodak 5219 35mm grain, and rec.709 color lock.' },
      ];
      estimatedAttempts = {
        'Hero Keyframes': 4,
        'DoP Camera Motion': 3,
        'Video Scene Synthesis': 5,
        'Voiceover Synthesis': 2,
        'Neural Master 4K': 2,
      };
    } else if (text.includes('electrolyte') || text.includes('energy') || text.includes('drink') || text.includes('crispvolt')) {
      jobType = 'social_video_ad';
      conciseSummary = 'Fast-paced 15-second vertical kinetic product motion spot for sparkling beverage with explosive liquid splash and neon typography.';
      deliverables = [
        {
          name: '15s Kinetic Vertical Spot',
          type: 'Social Motion Loop',
          format: 'MP4 H.265',
          aspectRatio: '9:16',
          durationSeconds: 15,
          resolution: '1080x1920 (FHD)',
          exactTextRequirements: ['"SURGE RECHARGE"', '"CrispVolt Yuzu Citrus"'],
          description: 'High-speed explosive beverage splash with volumetric micro-bubbles and rhythmic cuts.',
        },
      ];
      proposedWorkflow = [
        { stepName: 'Splash Keyframe', capabilityNeeded: 'keyframe_generation', purpose: 'Establish high-speed citrus beverage splash lighting and can packshot hero angle.' },
        { stepName: 'Fluid Video Synthesis', capabilityNeeded: 'video_scene_synthesis', purpose: 'Generate 15-second explosive fluid simulation and can rotation.' },
      ];
      estimatedAttempts = {
        'Splash Keyframe': 3,
        'Fluid Video Synthesis': 4,
      };
    } else {
      jobType = 'commercial_product_teaser';
      conciseSummary = 'Dynamic commercial product launch teaser highlighting engineered physical craftsmanship and kinematic motion.';
      deliverables = [
        {
          name: 'Kinetic Product Launch Film',
          type: 'Hero Video',
          format: 'ProRes 422 HQ / MP4 H.265',
          aspectRatio: '16:9',
          durationSeconds: 30,
          resolution: '3840x2160 (4K UHD)',
          exactTextRequirements: ['"Engineered for the Unseen"'],
          description: 'Dynamic biomechanical sprint sequences, fluid particulate lighting, and shoe sole close-up.',
        },
        {
          name: 'Social Vertical Teaser',
          type: 'Social Cutdown',
          format: 'MP4 H.265',
          aspectRatio: '9:16',
          durationSeconds: 15,
          resolution: '1080x1920 (FHD)',
          exactTextRequirements: ['"Engineered for the Unseen"'],
          description: 'Looping vertical hero motion asset for Instagram Stories and TikTok.',
        },
      ];
      proposedWorkflow = [
        { stepName: 'Concept Keyframes', capabilityNeeded: 'keyframe_generation', purpose: 'Establish dynamic product angles and high-contrast studio illumination.' },
        { stepName: 'Camera Motion Pass', capabilityNeeded: 'camera_motion', purpose: 'Simulate high-velocity tracking push-ins.' },
        { stepName: 'Generative Video Scenes', capabilityNeeded: 'video_scene_synthesis', purpose: 'Render physical deformations, particulate trails, and ground contact.' },
        { stepName: 'Audio Synthesis', capabilityNeeded: 'voiceover_synthesis', purpose: 'Produce punchy rhythmic narrator voice track.' },
        { stepName: 'Neural Upscale & Master', capabilityNeeded: 'neural_upscale_grade', purpose: '4K super-resolution upscaling and color mastering.' },
      ];
      estimatedAttempts = {
        'Concept Keyframes': 3,
        'Camera Motion Pass': 3,
        'Generative Video Scenes': 4,
        'Audio Synthesis': 2,
        'Neural Upscale & Master': 1,
      };
    }

    // Rights and consent flags
    const rightsAndConsentFlags: ValidatedBriefAnalysis['rightsAndConsentFlags'] = [];

    if (text.includes('soundalike') || text.includes('daft punk') || text.includes('the weeknd') || text.includes('music')) {
      rightsAndConsentFlags.push({
        flag: 'Soundalike / Copyrighted Music Imitation',
        severity: 'high',
        details: 'Client requested rhythm matching specific commercial music artists. Commercial sync license or synthetic original required.',
      });
    }

    if (text.includes('celebrity') || text.includes('actor') || text.includes('likeness')) {
      rightsAndConsentFlags.push({
        flag: 'Real Person Likeness or Voice Clone',
        severity: 'high',
        details: 'Involves recognizable identity or celebrity archetype. Operator must verify written talent release.',
      });
    }

    if (text.includes('logo') || text.includes('packshot') || text.includes('can packaging')) {
      rightsAndConsentFlags.push({
        flag: 'Exact Logo & Packaging Text Requirements',
        severity: 'medium',
        details: 'Requires exact brand logo rendering. Operator must verify transparent vector asset and client authorization.',
      });
    }

    if (rightsAndConsentFlags.length === 0) {
      rightsAndConsentFlags.push({
        flag: 'Original Synthetic Generation',
        severity: 'low',
        details: 'Fully synthetic original creative prompts with no copyrighted trademark or celebrity likeness detected.',
      });
    }

    const missingAssets: string[] = [];
    if (!text.includes('vector') && !text.includes('svg')) {
      missingAssets.push('High-resolution transparent vector SVG brand logo');
    }
    if (!text.includes('script') && !text.includes('manifesto')) {
      missingAssets.push('Approved finalized voiceover script document');
    }

    const mockData: ValidatedBriefAnalysis = {
      jobType,
      conciseSummary,
      deliverables,
      suppliedAssets: input.referenceAssets?.map(r => r.name) || ['Inbound brief specifications and reference links'],
      missingAssets,
      questionsForClient: [
        'Can client supply vector SVG assets for high-resolution title card rasterization?',
        'Is the audio soundtrack intended to be synthetic ambient score or client-licensed master stems?',
      ],
      brandConstraints: [
        'Maintain photorealistic lighting; zero uncanny plastic skin texture.',
        'Strict adherence to high dynamic range color palette and cinematic contrast.',
      ],
      rightsAndConsentFlags,
      technicalRisks: [
        'Temporal consistency across macro liquid or particulate physics.',
        'High dynamic camera trajectory requires accurate motion vector stabilization.',
      ],
      revisionRisk: rightsAndConsentFlags.some(f => f.severity === 'high') ? 'high' : 'low',
      confidence: budget < 500 ? 95 : 92,
      decision: budget < 500 ? 'reject' : rightsAndConsentFlags.some(f => f.severity === 'high') ? 'human_review' : 'accept',
      decisionReasons: [
        `Preliminary AI appraisal: Deliverables fit standard Higgsfield generative capabilities.`,
      ],
      proposedWorkflow,
      estimatedAttemptsByStep: estimatedAttempts,
      assumptions: [
        'Client will provide finalized copy before vocal synthesis pass.',
        'Final delivery format will be Rec.709 10-bit color space.',
      ],
    };

    // Ensure mock data strictly satisfies Zod schema
    const validated = BriefAnalysisSchema.parse(mockData);
    return validated;
  }
}
