import { Job, HumanApprovalCheckpoints } from '@/types';

export interface GuardrailCheckResult {
  allowed: boolean;
  reason?: string;
  requiredApproval?: 'workflow' | 'budget' | 'rights' | 'finalDelivery' | 'forbiddenMarketplaceAction';
}

export class OperatorGuardrails {
  /**
   * Evaluates whether an automated marketplace action is permitted.
   * By design specification: Autonomous marketplace scraping, bidding, contracting,
   * messaging, and delivery are STRICTLY FORBIDDEN without explicit human approval.
   */
  static validateMarketplaceAction(action: 'scrape' | 'submit_proposal' | 'accept_contract' | 'send_message' | 'deliver_marketplace'): GuardrailCheckResult {
    return {
      allowed: false,
      reason: `Automated marketplace action '${action}' is prohibited by safety policy. Marketplace actions require explicit human manual execution.`,
      requiredApproval: 'forbiddenMarketplaceAction',
    };
  }

  /**
   * Validates if generation steps are authorized to run.
   * Requires:
   * 1. Workflow approval by human operator.
   * 2. Budget ceiling approved and estimated spend within maxApprovedBudget.
   * 3. Rights concerns flagged as requiring approval must be explicitly cleared.
   */
  static validateExecutionAuthorization(
    job: Job,
    estimatedTotalSpend: number,
    hasUnresolvedHighRightsIssue: boolean
  ): GuardrailCheckResult {
    if (!job.approvalCheckpoints.workflowApproved) {
      return {
        allowed: false,
        reason: 'Generation halted: Initial workflow production plan requires Human Operator approval before any models can run.',
        requiredApproval: 'workflow',
      };
    }

    if (!job.approvalCheckpoints.maxBudgetApproved || !job.maxApprovedBudget) {
      return {
        allowed: false,
        reason: 'Generation halted: Maximum production budget ceiling has not been locked and approved by Human Operator.',
        requiredApproval: 'budget',
      };
    }

    if (estimatedTotalSpend > job.maxApprovedBudget) {
      return {
        allowed: false,
        reason: `Budget overrun: Estimated generation spend ($${estimatedTotalSpend.toFixed(2)}) exceeds approved ceiling ($${job.maxApprovedBudget.toFixed(2)}). Operator budget increase approval required.`,
        requiredApproval: 'budget',
      };
    }

    if (hasUnresolvedHighRightsIssue && !job.approvalCheckpoints.rightsCleared) {
      return {
        allowed: false,
        reason: 'Rights issue detected in brief analysis. Operator clearance is mandatory prior to generating commercial assets.',
        requiredApproval: 'rights',
      };
    }

    return { allowed: true };
  }

  /**
   * Validates whether final delivery can be dispatched or packaged.
   */
  static validateFinalDelivery(job: Job): GuardrailCheckResult {
    if (!job.approvalCheckpoints.finalDeliveryApproved) {
      return {
        allowed: false,
        reason: 'Final delivery requires explicit Human Operator sign-off and QA verification.',
        requiredApproval: 'finalDelivery',
      };
    }
    return { allowed: true };
  }
}
