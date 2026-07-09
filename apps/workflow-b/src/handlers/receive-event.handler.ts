import type { Context } from 'aws-lambda';
import { createLogger } from '@org/shared-observability';
import { WORKFLOW_NAME, type PropostaEvent, type StepResult } from './types.js';

const logger = createLogger({ service: WORKFLOW_NAME, handler: 'receive-event' });

/**
 * Entry point of the workflow: acknowledges an incoming proposal event and
 * marks it RECEIVED. In production this is triggered by the workflow's SQS /
 * EventBridge source (see infra/workflow-b/terraform).
 */
export const handler = async (
  event: PropostaEvent,
  context: Context
): Promise<StepResult> => {
  const proposta = event.payload;
  logger.info('proposta.received', {
    requestId: context.awsRequestId,
    propostaId: proposta.id,
    valor: proposta.valor,
  });

  return {
    workflow: WORKFLOW_NAME,
    step: 'receive-event',
    propostaId: proposta.id,
    status: 'RECEIVED',
  };
};
