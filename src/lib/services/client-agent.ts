import { Job } from '@/types';
import {
  ClientMessage,
  MessageType,
  ScopeProposal,
  ChangeOrder,
  ProductizedServiceTemplate,
} from '@/types/autonomy';
import { getRepository } from '../repository/json-repository';
import { AutonomyManager } from './autonomy-manager';
import { AuditLogger } from './audit-logger';
import { getTemplateById } from '../constants/templates';

export class ClientAgent {
  /**
   * Converts a raw or vague intake request into a structured intake dialogue
   * and identifies specific missing inputs.
   */
  static generateIntakeDialogue(job: Job): {
    summary: string;
    missingMaterialQuestions: Array<{
      id: string;
      category: 'quality' | 'cost' | 'rights' | 'deadline';
      question: string;
      whyMaterial: string;
    }>;
    specificAssetRequests: Array<{
      type: string;
      label: string;
      description: string;
      required: boolean;
      status: 'pending' | 'supplied';
    }>;
  } {
    const rawLower = job.rawBrief.toLowerCase();

    const missingQuestions = [];
    const assetRequests = [];

    // Check specific assets based on brief contents
    const hasLogo = job.referenceAssets.some(a => a.name.toLowerCase().includes('logo'));
    const hasProduct = job.referenceAssets.some(
      a =>
        a.name.toLowerCase().includes('bottle') ||
        a.name.toLowerCase().includes('pack') ||
        a.name.toLowerCase().includes('can') ||
        a.name.toLowerCase().includes('product')
    );

    assetRequests.push({
      type: 'product_image',
      label: 'Product Packshot / Clean Reference',
      description: 'High-resolution image or transparent PNG of the physical packaging or product bottle.',
      required: true,
      status: (hasProduct ? 'supplied' : 'pending') as 'pending' | 'supplied',
    });

    assetRequests.push({
      type: 'logo_vector',
      label: 'Brand Logo Vector (.SVG / .AI)',
      description: 'Clean vector brand mark for high-resolution title cards and packaging alignment.',
      required: true,
      status: (hasLogo ? 'supplied' : 'pending') as 'pending' | 'supplied',
    });

    assetRequests.push({
      type: 'brand_guide',
      label: 'Brand Color & Typography Guide',
      description: 'HEX codes, primary typography, and tone of voice guardrails.',
      required: false,
      status: 'pending' as const,
    });

    assetRequests.push({
      type: 'pronunciation_guide',
      label: 'Brand & Product Phonetic Pronunciation',
      description: 'Phonetic spelling for studio voiceover to prevent audio mispronunciation.',
      required: rawLower.includes('voice') || rawLower.includes('audio'),
      status: 'pending' as const,
    });

    assetRequests.push({
      type: 'examples_liked',
      label: 'Style References & Examples Liked',
      description: '1-2 visual reference links or video ads matching your desired mood and pacing.',
      required: false,
      status: 'pending' as const,
    });

    // Material questions affecting quality, cost, rights, or deadline
    if (!job.deadline) {
      missingQuestions.push({
        id: 'q-deadline',
        category: 'deadline' as const,
        question: 'What is your hard campaign launch deadline?',
        whyMaterial: 'Dictates whether fast-turnaround GPU lanes or normal batch queue schedules must be allocated.',
      });
    }

    if (rawLower.includes('voice') || rawLower.includes('audio') || rawLower.includes('narrat')) {
      missingQuestions.push({
        id: 'q-pronunciation',
        category: 'quality' as const,
        question: 'Could you confirm the exact phonetic pronunciation of your product name for the vocal narration?',
        whyMaterial: 'Prevents voiceover re-recording costs and phoneme sync misalignment in post-production.',
      });
    }

    if (rawLower.includes('person') || rawLower.includes('actor') || rawLower.includes('face') || rawLower.includes('voice')) {
      missingQuestions.push({
        id: 'q-likeness-consent',
        category: 'rights' as const,
        question: 'Will any real individuals or brand spokespersons be depicted, and do you possess signed likeness and voice releases?',
        whyMaterial: 'Legal compliance: unconsented likenesses pause production and create significant studio liability.',
      });
    }

    if (rawLower.includes('water') || rawLower.includes('rain') || rawLower.includes('liquid') || rawLower.includes('reflection')) {
      missingQuestions.push({
        id: 'q-liquid-physics',
        category: 'quality' as const,
        question: 'For the wet ground and glass reflection sequences, do you prefer high-contrast specular reflections or soft matte refraction?',
        whyMaterial: 'Directly influences keyframe lighting model selection (Seedream 2.0 vs Soul 2.0).',
      });
    }

    return {
      summary: `Client brief analyzed. Identified ${missingQuestions.length} material questions and ${assetRequests.length} key asset specifications.`,
      missingMaterialQuestions: missingQuestions,
      specificAssetRequests: assetRequests,
    };
  }

  /**
   * Drafts a plain-English scope proposal with deliverables, timeline, price,
   * included revisions, and exclusions.
   */
  static draftScopeProposal(job: Job, templateId?: string): ScopeProposal {
    const template = templateId ? getTemplateById(templateId) : null;

    const price = template ? template.fixedPriceUSD : job.budget || 2400;
    const turnaround = template ? `${template.turnaroundHours} hours from asset lock` : '72 hours from asset lock';
    const includedRevs = template ? `${template.includedRevisions} consolidated revision rounds` : '2 consolidated revision rounds';

    const deliverables = template
      ? template.deliverablesSummary.map(d => ({ name: d, specs: '4K ProRes / 1080x1920 MP4', format: 'Digital Master' }))
      : [
          { name: '15-Second Cinematic Hero Video', specs: '16:9 Landscape 4K ProRes 422', format: 'Broadcast Master' },
          { name: '15-Second Social Vertical Cutdown', specs: '9:16 1080x1920 for Reels/TikTok', format: 'Social Ready' },
          { name: '3x High-Res Still Keyframes', specs: '3840x2160 JPEG / PNG', format: 'Key Art' },
        ];

    return {
      id: `prop-${job.id}`,
      jobId: job.id,
      deliverables,
      timeline: turnaround,
      priceUSD: price,
      includedRevisions: includedRevs,
      exclusions: [
        'Out-of-scope conceptual re-shoots after initial storyboard sign-off',
        'Physical on-location production filming',
        'Paid advertising media spend',
        'Additional foreign language localizations (available as an add-on pack)',
      ],
      plainEnglishSummary: `We will produce a premium 15-second cinematic hero commercial for ${job.title}, delivered in both widescreen 16:9 and vertical 9:16 with 3 high-res stills within ${turnaround}. Includes ${includedRevs}.`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Creates a client message draft and evaluates whether it may be auto-sent
   * or must be held for human approval (strictly drafted for 3rd-party marketplaces).
   */
  static async createMessageDraft(params: {
    job: Job;
    type: MessageType;
    subject: string;
    body: string;
    channelOverride?: ClientMessage['channel'];
  }): Promise<ClientMessage> {
    const repo = getRepository();

    // Determine channel based on job source
    let channel: ClientMessage['channel'] = 'email';
    if (params.channelOverride) {
      channel = params.channelOverride;
    } else if (params.job.source === 'Upwork') {
      channel = 'upwork_safe_draft';
    } else if (params.job.source === 'Contra') {
      channel = 'contra_safe_draft';
    } else if (params.job.source === 'Fiverr') {
      channel = 'fiverr_safe_draft';
    } else {
      channel = 'email';
    }

    const requiresApproval = true; // All external messages strictly require operator review in this release
    const isMarketplace = channel.includes('draft') || channel.includes('marketplace');

    const msg: ClientMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      jobId: params.job.id,
      type: params.type,
      direction: 'outbound',
      subject: params.subject,
      body: params.body,
      status: 'drafted',
      channel,
      isMarketplaceSafeDraft: isMarketplace,
      requiresHumanApproval: requiresApproval,
      createdAt: new Date().toISOString(),
      meta: {
        dispatchPolicy: 'All external messages require operator approval in this release',
      },
    };

    await repo.saveClientMessage(msg);

    await AuditLogger.log({
      jobId: params.job.id,
      jobTitle: params.job.title,
      eventType: 'message_draft',
      actor: 'agent',
      summary: `Drafted ${params.type}: "${params.subject}"`,
      details: `Created draft requiring operator review before release via ${channel}.`,
      meta: { messageId: msg.id },
    });

    return msg;
  }

  /**
   * Milestone progress update (useful, real milestones instead of generic status)
   */
  static async createMilestoneUpdate(
    job: Job,
    milestone: 'intake_locked' | 'keyframes_approved' | 'motion_synthesized' | 'finishing_complete'
  ): Promise<ClientMessage> {
    let subject = '';
    let body = '';

    switch (milestone) {
      case 'intake_locked':
        subject = `Production Kick-off: ${job.title} scope locked`;
        body = `Hi there,\n\nWe have locked your project specifications and verified all incoming reference assets. Concept exploration is underway across our lighting and camera lanes.\n\nNext update: Concept Keyframes for your review within 24 hours.`;
        break;

      case 'keyframes_approved':
        subject = `Milestone Reached: Master Keyframes locked for ${job.title}`;
        body = `Hi there,\n\nGreat news: the master keyframe compositions and lighting profiles have been locked. We are now advancing to high-coherence cinematic video synthesis and camera trajectory passes.\n\nNext update: Initial motion cut preview.`;
        break;

      case 'motion_synthesized':
        subject = `Milestone Reached: Video motion plates synthesized for ${job.title}`;
        body = `Hi there,\n\nAll primary cinematic motion passes and camera tracking sequences have rendered successfully. We are now performing internal QA, label continuity alignment, and audio mix mastering.\n\nNext update: Final preview cut.`;
        break;

      case 'finishing_complete':
        subject = `Milestone Reached: 4K Neural Mastering complete for ${job.title}`;
        body = `Hi there,\n\nYour commercial has completed 4K UHD neural upscaling, 35mm grain matching, and broadcast audio mix. The final delivery package is being compiled for human verification and release.`;
        break;
    }

    return this.createMessageDraft({
      job,
      type: 'milestone_update',
      subject,
      body,
    });
  }

  /**
   * Concept presentation: explains what changed and what decision is needed.
   */
  static async presentConcepts(
    job: Job,
    conceptTitle: string,
    whatChanged: string,
    decisionNeeded: string,
    previewUrls: string[]
  ): Promise<ClientMessage> {
    const subject = `Concept Review: ${conceptTitle} (${job.title})`;
    const body = `Hi there,\n\nWe have assembled the latest creative concepts for your review.\n\n` +
      `**What Changed:**\n${whatChanged}\n\n` +
      `**Decision Needed From You:**\n${decisionNeeded}\n\n` +
      `**Preview Assets:**\n${previewUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}\n\n` +
      `Please let us know your preferred selection so we can lock the downstream camera motion passes.`;

    return this.createMessageDraft({
      job,
      type: 'concept_presentation',
      subject,
      body,
    });
  }

  /**
   * Revision feedback interpreter:
   * - Identifies which asset and production step it affects
   * - Estimates additional cost
   * - Distinguishes an included revision from a scope change
   */
  static interpretRevisionFeedback(
    job: Job,
    feedbackNote: string,
    currentRevisionRound: number,
    maxIncludedRevisions = 2
  ): {
    affectedAsset: string;
    affectedProductionStep: string;
    isScopeChange: boolean;
    recommendedAction: string;
    estimatedCostUSD: number;
    reasoning: string;
    interpretationOptions?: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      recommended: boolean;
    }>;
  } {
    const noteLower = feedbackNote.toLowerCase();

    // Check if it's a lighting/mood tweak (e.g. "make final reveal warmer and more hopeful")
    if (
      noteLower.includes('warmer') ||
      noteLower.includes('hopeful') ||
      noteLower.includes('color') ||
      noteLower.includes('grade') ||
      noteLower.includes('lighting')
    ) {
      const isScopeChange = currentRevisionRound > maxIncludedRevisions;
      return {
        affectedAsset: '15-Second Master Hero Video & 9:16 Vertical Cut',
        affectedProductionStep: 'Finishing & 4K Neural Color Grade (Topaz / Color LUT)',
        isScopeChange,
        recommendedAction: 'Adjust color temperature curve towards 3800K warm sunrise tone and brighten final 3-second highlight reveal.',
        estimatedCostUSD: isScopeChange ? 75.0 : 0.0, // Included in revision round
        reasoning: isScopeChange
          ? `Feedback received on Revision Round ${currentRevisionRound}, which exceeds the ${maxIncludedRevisions} included rounds.`
          : `Feedback falls within included Revision Round ${currentRevisionRound} of ${maxIncludedRevisions}. Covered by original contract fee.`,
        interpretationOptions: [
          {
            id: 'opt-color-lut',
            category: 'color_grade' as const,
            title: 'Option A: Post-Production Warm Color LUT (Recommended)',
            description: 'Apply warm sunrise tone curve (3800K) and highlight bloom in post-finishing. Zero extra generation cost; fastest turnaround.',
            recommended: true,
          },
          {
            id: 'opt-sun-flare',
            category: 'lighting_reshoot' as const,
            title: 'Option B: Video Re-Synthesis with Morning Sun Flare',
            description: 'Re-prompt Shot 01 in Seedance 2.5 with explicit "golden hour lens flare and warm morning backlighting". Requires GPU regeneration ($1.50).',
            recommended: false,
          },
          {
            id: 'opt-audio-pace',
            category: 'soundtrack_pacing' as const,
            title: 'Option C: Acoustic Audio Tempo & Voicing Adjustment',
            description: 'Shift background audio track to warmer acoustic rhythm and adjust voiceover EQ for an intimate, optimistic delivery.',
            recommended: false,
          },
        ],
      };
    }

    // Check if it's a fundamental re-shoot or product replacement
    if (
      noteLower.includes('new product') ||
      noteLower.includes('different model') ||
      noteLower.includes('change the script completely') ||
      noteLower.includes('re-shoot')
    ) {
      return {
        affectedAsset: 'Entire Master Video Sequence and Storyboard',
        affectedProductionStep: 'All Steps (Concept through Final Video Gen)',
        isScopeChange: true,
        recommendedAction: 'Issue formal Change Order for conceptual re-shoot.',
        estimatedCostUSD: 450.0,
        reasoning: 'Request requires discarding approved keyframes and re-running all video generation passes. Exceeds standard revision scope.',
      };
    }

    // Default minor revision
    const isScopeChange = currentRevisionRound > maxIncludedRevisions;
    return {
      affectedAsset: 'Master Video Cut',
      affectedProductionStep: 'Video Scene Synthesis & Finishing',
      isScopeChange,
      recommendedAction: 'Apply targeted re-render to affected scene.',
      estimatedCostUSD: isScopeChange ? 50.0 : 0.0,
      reasoning: isScopeChange
        ? `Exceeds ${maxIncludedRevisions} included revision rounds.`
        : `Covered under Revision Round ${currentRevisionRound} of ${maxIncludedRevisions}.`,
    };
  }

  /**
   * Drafts a formal Change Order when a client request exceeds scope.
   */
  static async draftChangeOrder(
    job: Job,
    feedbackNote: string,
    interpretation: ReturnType<typeof ClientAgent.interpretRevisionFeedback>
  ): Promise<ChangeOrder> {
    const repo = getRepository();

    const changeOrder: ChangeOrder = {
      id: `co-${Date.now().toString(36)}`,
      jobId: job.id,
      requestedChangeDescription: feedbackNote,
      affectedAsset: interpretation.affectedAsset,
      affectedProductionStep: interpretation.affectedProductionStep,
      isScopeChange: true,
      reasoning: interpretation.reasoning,
      incrementalCostUSD: interpretation.estimatedCostUSD || 150.0,
      additionalDays: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    await repo.saveChangeOrder(changeOrder);

    // Draft client message explaining the change order
    await this.createMessageDraft({
      job,
      type: 'change_order',
      subject: `Change Order Proposal: ${job.title}`,
      body: `Hi there,\n\nWe received your request: "${feedbackNote}".\n\n` +
        `Because this exceeds our agreed ${interpretation.affectedAsset} revision limits (${interpretation.reasoning}), we have prepared Change Order #${changeOrder.id}.\n\n` +
        `**Scope Adjustment:** ${interpretation.recommendedAction}\n` +
        `**Incremental Fee:** $${changeOrder.incrementalCostUSD.toFixed(2)}\n` +
        `**Timeline Adjustment:** +${changeOrder.additionalDays} business day\n\n` +
        `Please confirm if you would like us to proceed with this update.`,
    });

    return changeOrder;
  }

  /**
   * Prepares the final delivery package, file list, usage notes, and client message.
   */
  static async prepareFinalDeliveryPackage(
    job: Job,
    fileList: Array<{ name: string; format: string; resolution: string; url: string }>,
    usageNotes: string
  ): Promise<ClientMessage> {
    const subject = `Final Delivery Package: ${job.title}`;
    const body = `Hi there,\n\n` +
      `We are delighted to deliver the completed creative package for **${job.title}**!\n\n` +
      `**Delivered Files:**\n` +
      fileList.map((f, i) => `${i + 1}. **${f.name}** (${f.format}, ${f.resolution}) — [Download](${f.url})`).join('\n') +
      `\n\n**Usage & Rights Notes:**\n${usageNotes}\n\n` +
      `All finished commercial assets belong fully to your brand per our agreement.\n\n` +
      `Thank you for working with us on this launch!`;

    // Strictly drafts for human operator sign-off
    return this.createMessageDraft({
      job,
      type: 'final_delivery',
      subject,
      body,
    });
  }

  /**
   * Post-delivery retention & feedback request:
   * Requests feedback, testimonial, and introduces a recurring monthly retainer.
   */
  static async draftRetentionFollowup(job: Job): Promise<ClientMessage> {
    const subject = `How did the launch go? + Monthly Creative Partnership for ${job.clientName}`;
    const body = `Hi there,\n\n` +
      `Now that your campaign for **${job.title}** is out in the world, we wanted to check in on how your audience is responding!\n\n` +
      `If you loved the final work, we would deeply appreciate a 2-sentence testimonial for our studio portfolio.\n\n` +
      `**Keep Your Momentum Going:**\n` +
      `To keep your social and ad channels fresh without repeating production setup costs, we offer a **Monthly Creative Retainer** ($1,250/mo), which includes:\n` +
      `• 4 new social video cutdowns or campaign variants each month\n` +
      `• Fast 48-hour turnarounds on fresh hooks and seasonal promotions\n` +
      `• Priority access to our generative finishing lanes\n\n` +
      `Let us know if you'd like to reserve a monthly slot for next month!`;

    return this.createMessageDraft({
      job,
      type: 'retention_followup',
      subject,
      body,
    });
  }
}
