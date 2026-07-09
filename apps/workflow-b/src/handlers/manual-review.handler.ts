import type { Context } from 'aws-lambda';
import { createLogger } from '@org/shared-observability';
import { WORKFLOW_NAME, type PropostaEvent, type StepResult } from './types.js';

const logger = createLogger({ service: WORKFLOW_NAME, handler: 'manual-review' });

/**
 * Applies a human reviewer's decision to a proposal that was flagged
 * IN_REVIEW. The decision is expected on `event.review`.
 */
export const handler = async (
  event: PropostaEvent,
  context: Context
): Promise<StepResult> => {
  const proposta = event.payload;
  const review = event.review ?? { approve: false, reviewer: 'unknown' };
  const status: StepResult['status'] = review.approve ? 'APPROVED' : 'REJECTED';

  logger.info('proposta.reviewed', {
    requestId: context.awsRequestId,
    propostaId: proposta.id,
    reviewer: review.reviewer,
    status,
  });

  return {
    workflow: WORKFLOW_NAME,
    step: 'manual-review',
    propostaId: proposta.id,
    status,
    detail: { reviewer: review.reviewer },
  };
};
