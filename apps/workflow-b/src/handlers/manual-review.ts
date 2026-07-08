import { type Proposta, Status } from 'shared-domain';
import { evaluateFraudRisk } from 'shared-fraud-engine';
import { createLogger, withTrace } from 'shared-observability';

const logger = createLogger('workflow-b.manual-review');

export const manualReviewHandler = withTrace('workflow-b.manual-review', async (event: { proposta: Proposta }) => {
  const fraudResult = evaluateFraudRisk(event.proposta);
  const needsReview = fraudResult.riskLevel !== 'low';

  logger.info('Revisão manual avaliada', {
    propostaId: event.proposta.id,
    riskLevel: fraudResult.riskLevel,
  });

  return {
    status: needsReview ? Status.EmRevisaoManual : Status.Finalizada,
    riskLevel: fraudResult.riskLevel,
    reasons: fraudResult.reasons,
  };
});
