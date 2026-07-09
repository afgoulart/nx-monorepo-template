import type { Context } from 'aws-lambda';
import { createLogger, withSpan } from '@org/shared-observability';
import { validateProposta } from '@org/shared-validation';
import { createRuleEngine, minimumValueRule } from '@org/shared-rules-engine';
import { checkFraud } from '@org/shared-fraud-engine';
import {
  MIN_VALOR,
  WORKFLOW_NAME,
  type PropostaEvent,
  type StepResult,
} from './types.js';

const logger = createLogger({ service: WORKFLOW_NAME, handler: 'validate' });

const ruleEngine = createRuleEngine().add(minimumValueRule(MIN_VALOR));

/**
 * Validates the proposal, runs the shared rule + fraud engines and decides the
 * next status:
 *   - invalid data or failing rules -> REJECTED
 *   - high fraud risk               -> IN_REVIEW (manual review)
 *   - otherwise                     -> APPROVED
 */
export const handler = async (
  event: PropostaEvent,
  context: Context
): Promise<StepResult> =>
  withSpan(
    'validate',
    async () => {
      const proposta = event.payload;

      const validation = validateProposta(proposta);
      const rules = await ruleEngine.run(proposta);
      const fraud = checkFraud({
        documento: proposta.cliente.documento,
        valor: proposta.valor,
      });

      let status: StepResult['status'];
      if (!validation.valid || !rules.passed) {
        status = 'REJECTED';
      } else if (fraud.risk === 'high') {
        status = 'IN_REVIEW';
      } else {
        status = 'APPROVED';
      }

      logger.info('proposta.validated', {
        requestId: context.awsRequestId,
        propostaId: proposta.id,
        status,
        fraudScore: fraud.score,
        ruleFailures: rules.failures,
      });

      return {
        workflow: WORKFLOW_NAME,
        step: 'validate',
        propostaId: proposta.id,
        status,
        detail: {
          validationErrors: validation.errors,
          ruleFailures: rules.failures,
          fraud,
        },
      };
    },
    logger
  );
