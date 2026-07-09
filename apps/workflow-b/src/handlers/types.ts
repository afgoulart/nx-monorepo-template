import type { Proposta, WorkflowEvent } from '@org/shared-domain';

/** Identifies this workflow across events, logs and infrastructure. */
export const WORKFLOW_NAME = 'workflow-b';

/**
 * Business threshold that is specific to workflow-b. Keeping it local (rather
 * than in a shared lib) is the point of the architecture: each workflow tunes
 * its own rules without affecting the others.
 */
export const MIN_VALOR = 250_000;

/** Each step receives a proposal wrapped in the shared event envelope. */
export type PropostaEvent = WorkflowEvent<Proposta> & {
  /** Optional per-step extras, e.g. a reviewer decision. */
  review?: { approve: boolean; reviewer: string };
};

export interface StepResult {
  workflow: string;
  step: string;
  propostaId: string;
  status: Proposta['status'];
  detail?: Record<string, unknown>;
}
