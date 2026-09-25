import { BriefAnalysis, Workflow, Job } from '@/types';
import { ModelRouter } from './model-router';

export class WorkflowPlanner {
  /**
   * Constructs an ordered, multi-model production plan tailored to the analyzed brief
   * using the transparent capability catalog and production role principles:
   * SEARCH -> CONTROL -> SHIP -> FINISH.
   */
  static generateWorkflow(analysis: BriefAnalysis, jobContext?: Partial<Job>): Workflow {
    return ModelRouter.planRoute(analysis, jobContext);
  }
}

