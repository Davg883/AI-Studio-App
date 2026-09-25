import { z } from 'zod';

export const StructuredDeliverableSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Deliverable name is required'),
  type: z.string().min(1, 'Deliverable type is required'),
  format: z.string().min(1, 'Deliverable format is required'),
  aspectRatio: z.string().min(1, 'Aspect ratio is required'),
  durationSeconds: z.number().nonnegative('Duration must be >= 0').optional().default(0),
  targetDurationSeconds: z.number().nonnegative().optional(),
  resolution: z.string().min(1, 'Resolution is required'),
  exactTextRequirements: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(''),
});

export const RightsAndConsentFlagSchema = z.object({
  flag: z.string().min(1, 'Flag description is required'),
  severity: z.enum(['low', 'medium', 'high']),
  details: z.string().min(1, 'Flag details are required'),
});

export const ProposedWorkflowStepSchema = z.object({
  stepName: z.string().min(1, 'Step name is required'),
  capabilityNeeded: z.string().min(1, 'Capability needed is required'),
  purpose: z.string().min(1, 'Purpose is required'),
});

export const BriefAnalysisSchema = z.object({
  jobType: z.string().min(1, 'Job type is required'),
  conciseSummary: z.string().min(1, 'Concise summary is required'),
  deliverables: z.array(StructuredDeliverableSchema).min(1, 'At least one deliverable is required'),
  suppliedAssets: z.array(z.string()),
  missingAssets: z.array(z.string()),
  questionsForClient: z.array(z.string()),
  brandConstraints: z.array(z.string()),
  rightsAndConsentFlags: z.array(RightsAndConsentFlagSchema),
  technicalRisks: z.array(z.string()),
  revisionRisk: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(100),
  decision: z.enum(['accept', 'human_review', 'reject']),
  decisionReasons: z.array(z.string()).min(1, 'At least one decision reason is required'),
  proposedWorkflow: z.array(ProposedWorkflowStepSchema).min(1, 'At least one workflow step is required'),
  estimatedAttemptsByStep: z.record(z.string(), z.number().min(1)),
  assumptions: z.array(z.string()),
});

export type ValidatedBriefAnalysis = z.infer<typeof BriefAnalysisSchema>;

/**
 * Strict JSON Schema formatted for OpenAI Structured Outputs
 * (compatible with response_format: { type: "json_schema", json_schema: { name: "...", strict: true, schema: ... } })
 */
export const OPENAI_BRIEF_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    jobType: {
      type: 'string',
      description: 'Standardized classification of the job (e.g. cinematic_concept_film, social_video_ad, product_viz, character_animation)',
    },
    conciseSummary: {
      type: 'string',
      description: 'One to two sentence executive summary of the client brief and creative objective.',
    },
    deliverables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          format: { type: 'string' },
          aspectRatio: { type: 'string' },
          durationSeconds: { type: 'number' },
          resolution: { type: 'string' },
          exactTextRequirements: {
            type: 'array',
            items: { type: 'string' },
          },
          description: { type: 'string' },
        },
        required: [
          'name',
          'type',
          'format',
          'aspectRatio',
          'durationSeconds',
          'resolution',
          'exactTextRequirements',
          'description',
        ],
        additionalProperties: false,
      },
    },
    suppliedAssets: {
      type: 'array',
      items: { type: 'string' },
      description: 'Reference files, moodboards, or materials confirmed provided by the client.',
    },
    missingAssets: {
      type: 'array',
      items: { type: 'string' },
      description: 'Essential items not provided (e.g. vector logo, font files, voiceover script, packaging CAD).',
    },
    questionsForClient: {
      type: 'array',
      items: { type: 'string' },
      description: 'Clarifying questions required before commencing production.',
    },
    brandConstraints: {
      type: 'array',
      items: { type: 'string' },
      description: 'Color rules, aesthetic tone restrictions, or strict client no-go boundaries.',
    },
    rightsAndConsentFlags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          flag: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          details: { type: 'string' },
        },
        required: ['flag', 'severity', 'details'],
        additionalProperties: false,
      },
      description: 'Flags regarding logos, trademarked packaging, celebrity likeness/voice, soundalike music, or deceptive impersonation.',
    },
    technicalRisks: {
      type: 'array',
      items: { type: 'string' },
      description: 'Technical challenges (e.g. fast hand motions, microscopic physics, photorealistic text in video).',
    },
    revisionRisk: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Likelihood of multiple client revision rounds based on brief clarity.',
    },
    confidence: {
      type: 'number',
      description: 'Model confidence score between 0 and 100 in the feasibility assessment.',
    },
    decision: {
      type: 'string',
      enum: ['accept', 'human_review', 'reject'],
      description: 'Astra recommendation before application deterministic cost & policy check.',
    },
    decisionReasons: {
      type: 'array',
      items: { type: 'string' },
      description: 'Strategic reasons justifying the preliminary decision.',
    },
    proposedWorkflow: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stepName: { type: 'string' },
          capabilityNeeded: {
            type: 'string',
            description: 'Standard capability (e.g. keyframe_generation, camera_motion, video_scene_synthesis, voiceover_synthesis, neural_upscale_grade). Must NOT be an invented model endpoint.',
          },
          purpose: { type: 'string' },
        },
        required: ['stepName', 'capabilityNeeded', 'purpose'],
        additionalProperties: false,
      },
    },
    estimatedAttemptsByStep: {
      type: 'object',
      description: 'Map of stepName to estimated generation attempts required to achieve commercial quality.',
      additionalProperties: { type: 'number' },
    },
    assumptions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Assumptions made during analysis regarding scope, asset quality, or delivery format.',
    },
  },
  required: [
    'jobType',
    'conciseSummary',
    'deliverables',
    'suppliedAssets',
    'missingAssets',
    'questionsForClient',
    'brandConstraints',
    'rightsAndConsentFlags',
    'technicalRisks',
    'revisionRisk',
    'confidence',
    'decision',
    'decisionReasons',
    'proposedWorkflow',
    'estimatedAttemptsByStep',
    'assumptions',
  ],
  additionalProperties: false,
};

export function validateBriefAnalysis(data: unknown): {
  success: boolean;
  data?: ValidatedBriefAnalysis;
  errors?: string[];
} {
  const result = BriefAnalysisSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues || [];
    const errors = issues.map(
      (err) => `${err.path?.join('.') || 'root'}: ${err.message}`
    );
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}
