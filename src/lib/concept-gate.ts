import { Workflow, WorkflowStep } from '@/types';

/**
 * Concept-selection checkpoint.
 *
 * The SEARCH step explores rough concepts; the operator must choose which ones (up to
 * MAX_CONCEPT_SELECTIONS) carry forward before any later step may run. "Run all" stops
 * at this point, and the generate API refuses later steps until a selection is recorded.
 */
export const MAX_CONCEPT_SELECTIONS = 2;

export function isConceptStep(step: WorkflowStep): boolean {
  return step.role === 'SEARCH' || !!step.requiresConceptSelection;
}

/** The concept step that must be completed and chosen from before `target` may run, if any. */
export function blockingConceptStep(workflow: Workflow, target: WorkflowStep): WorkflowStep | null {
  if (isConceptStep(target)) return null;
  return (
    [...workflow.steps]
      .sort((a, b) => a.order - b.order)
      .find(s => isConceptStep(s) && s.order < target.order && !s.conceptSelection) ?? null
  );
}

/** A completed concept step still waiting for the operator to choose, if any. */
export function pendingConceptSelection(workflow: Workflow | null | undefined): WorkflowStep | null {
  if (!workflow) return null;
  return (
    workflow.steps.find(s => isConceptStep(s) && s.status === 'Completed' && !s.conceptSelection) ?? null
  );
}

export function conceptGateMessage(step: WorkflowStep): string {
  return step.status === 'Completed'
    ? `Choose which concepts from "${step.name}" to carry forward before running later steps.`
    : `Run "${step.name}" and choose the concepts to carry forward before running later steps.`;
}
