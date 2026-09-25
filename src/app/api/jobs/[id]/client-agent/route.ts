import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';
import { ClientAgent } from '@/lib/services/client-agent';
import { AuditLogger } from '@/lib/services/audit-logger';
import { DEFAULT_OPERATOR_NAME } from '@/lib/operator-config';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const dialogue = ClientAgent.generateIntakeDialogue(job);
    const messages = await repo.getClientMessages(id);
    const proposal = await repo.getScopeProposal(id);
    const changeOrders = await repo.getChangeOrders(id);

    return NextResponse.json({
      success: true,
      dialogue,
      messages,
      proposal,
      changeOrders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch client agent data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Draft Proposal
    if (action === 'draft_proposal') {
      const { templateId } = body;
      const proposal = ClientAgent.draftScopeProposal(job, templateId);
      await repo.saveScopeProposal(proposal);

      await AuditLogger.log({
        jobId: job.id,
        jobTitle: job.title,
        eventType: 'model_decision',
        actor: 'agent',
        summary: `Scope Proposal Drafted for ${job.title}`,
        details: `Turnaround: ${proposal.timeline}, Price: $${proposal.priceUSD}. Template: ${templateId || 'Standard Custom'}.`,
      });

      return NextResponse.json({ success: true, proposal });
    }

    // 2. Draft Message
    if (action === 'draft_message') {
      const { type, subject, body: msgBody, channelOverride } = body;
      const message = await ClientAgent.createMessageDraft({
        job,
        type,
        subject,
        body: msgBody,
        channelOverride,
      });

      return NextResponse.json({ success: true, message });
    }

    // 3a. Authorise Message (Compute SHA-256 Seal)
    if (action === 'authorise_message') {
      const { messageId, operatorName = DEFAULT_OPERATOR_NAME } = body;
      const target = await repo.authoriseMessage(messageId, operatorName);
      return NextResponse.json({ success: true, message: target });
    }

    // 3b. Dispatch Message (Verify Seal & Release)
    if (action === 'dispatch_message') {
      const { messageId } = body;
      const target = await repo.dispatchMessage(messageId);
      return NextResponse.json({ success: true, message: target });
    }

    // 3c. Combined Authorise & Dispatch (for interactive UI button)
    if (action === 'approve_message') {
      const { messageId, operatorName = DEFAULT_OPERATOR_NAME } = body;
      await repo.authoriseMessage(messageId, operatorName);
      const target = await repo.dispatchMessage(messageId);
      return NextResponse.json({ success: true, message: target });
    }

    // 4. Milestone Progress Update
    if (action === 'send_milestone') {
      const { milestone } = body;
      const message = await ClientAgent.createMilestoneUpdate(job, milestone);
      return NextResponse.json({ success: true, message });
    }

    // 5. Present Concepts
    if (action === 'present_concept') {
      const { conceptTitle, whatChanged, decisionNeeded, previewUrls = [] } = body;
      const message = await ClientAgent.presentConcepts(
        job,
        conceptTitle,
        whatChanged,
        decisionNeeded,
        previewUrls
      );
      return NextResponse.json({ success: true, message });
    }

    // 6. Interpret Revision Feedback
    if (action === 'interpret_revision') {
      const { feedbackNote, currentRound = 1, maxIncluded = 2 } = body;
      const interpretation = ClientAgent.interpretRevisionFeedback(
        job,
        feedbackNote,
        currentRound,
        maxIncluded
      );

      await AuditLogger.log({
        jobId: job.id,
        jobTitle: job.title,
        eventType: 'model_decision',
        actor: 'agent',
        summary: `Revision Interpreted: ${interpretation.isScopeChange ? 'Scope Change' : 'Included Round'}`,
        details: `Affected Step: ${interpretation.affectedProductionStep}. Cost: $${interpretation.estimatedCostUSD}. Note: "${feedbackNote}".`,
      });

      return NextResponse.json({ success: true, interpretation });
    }

    // 7. Create Change Order
    if (action === 'create_change_order') {
      const { feedbackNote, interpretation } = body;
      const changeOrder = await ClientAgent.draftChangeOrder(job, feedbackNote, interpretation);

      await AuditLogger.log({
        jobId: job.id,
        jobTitle: job.title,
        eventType: 'scope_change_order',
        actor: 'agent',
        summary: `Change Order #${changeOrder.id} Created`,
        details: `Incremental Fee: $${changeOrder.incrementalCostUSD}. Reasoning: ${changeOrder.reasoning}`,
        spendDeltaUSD: changeOrder.incrementalCostUSD,
      });

      return NextResponse.json({ success: true, changeOrder });
    }

    // 8. Prepare Final Delivery Package
    if (action === 'prepare_delivery') {
      const { fileList = [], usageNotes = 'Commercial broadcast rights granted in perpetuity.' } = body;
      const message = await ClientAgent.prepareFinalDeliveryPackage(job, fileList, usageNotes);
      return NextResponse.json({ success: true, message });
    }

    // 9. Send Retention / Follow-up Proposal
    if (action === 'send_retention') {
      const message = await ClientAgent.draftRetentionFollowup(job);
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Client agent request failed' },
      { status: 500 }
    );
  }
}
