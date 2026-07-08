import { type Proposta, Status } from 'shared-domain';
import { createLogger, withTrace } from 'shared-observability';

const logger = createLogger('workflow-b.finalize');

export const finalizeHandler = withTrace('workflow-b.finalize', async (event: { proposta: Proposta }) => {
  logger.info('Workflow B finalizado', { propostaId: event.proposta.id });

  return {
    propostaId: event.proposta.id,
    status: Status.Finalizada,
  };
});
