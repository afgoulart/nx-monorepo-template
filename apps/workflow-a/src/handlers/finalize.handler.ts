import type { Context } from 'aws-lambda';
import { createLogger } from '@org/shared-observability';
import { WORKFLOW_NAME, type PropostaEvent, type StepResult } from './types.js';

const logger = createLogger({ service: WORKFLOW_NAME, handler: 'finalize' });

/**
 * Terminal step: persists the final outcome and (in production) would emit a
 * "proposta.finalized" event back onto the shared topic for downstream
 * consumers. Here we just log and return the finalized result.
 */
export const handler = async (
  event: PropostaEvent,
  context: Context
): Promise<StepResult> => {
  const proposta = event.payload;

  logger.info('proposta.finalized', {
    requestId: context.awsRequestId,
    propostaId: proposta.id,
    outcome: proposta.status,
  });

  return {
    workflow: WORKFLOW_NAME,
    step: 'finalize',
    propostaId: proposta.id,
    status: 'FINALIZED',
    detail: { outcome: proposta.status },
  };
};
