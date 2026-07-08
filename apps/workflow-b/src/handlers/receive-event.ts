import { type Proposta } from 'shared-domain';
import { WorkflowEventClient } from 'shared-event-client';
import { createLogger, withTrace } from 'shared-observability';

const logger = createLogger('workflow-b.receive-event');
const eventClient = new WorkflowEventClient({
  'workflow-a': 'workflow-a-events-queue',
  'workflow-b': 'workflow-b-events-queue',
});

export const receiveEventHandler = withTrace('workflow-b.receive-event', async (event: { detail?: { proposta?: Proposta } }) => {
  const proposta = event.detail?.proposta;
  if (!proposta) {
    logger.warn('Evento sem proposta recebida');
    return { accepted: false, reason: 'missing-proposta' };
  }

  const routing = eventClient.routeEvent({ workflow: 'workflow-b', propostaId: proposta.id });
  logger.info('Evento roteado para fila de workflow', routing);

  return {
    accepted: true,
    queueName: routing.queueName,
    propostaId: proposta.id,
  };
});
