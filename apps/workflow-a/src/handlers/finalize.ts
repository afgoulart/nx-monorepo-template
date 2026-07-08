import { type Proposta, Status } from 'shared-domain';
import { createLogger, withTrace } from 'shared-observability';

const logger = createLogger('workflow-a.finalize');

export const finalizeHandler = withTrace('workflow-a.finalize', async (event: { proposta: Proposta }) => {
  logger.info('Workflow A finalizado', { propostaId: event.proposta.id });

  return {
    propostaId: event.proposta.id,
    status: Status.Finalizada,
  };
});
