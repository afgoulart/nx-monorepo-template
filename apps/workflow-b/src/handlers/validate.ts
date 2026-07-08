import { type Proposta, Status } from 'shared-domain';
import { RuleEngine, type RuleInput } from 'shared-rules-engine';
import { createLogger, withTrace } from 'shared-observability';
import { validatePropostaData } from 'shared-validation';

const logger = createLogger('workflow-b.validate');
const ruleEngine = new RuleEngine<RuleInput>();

export const validateHandler = withTrace('workflow-b.validate', async (event: { proposta: Proposta }) => {
  const validation = validatePropostaData(event.proposta);
  const ruleResult = ruleEngine.evaluate({
    proposta: event.proposta,
    eventName: 'validate',
  });

  const isValid = validation.valid && ruleResult.approved;
  logger.info('Validação finalizada', {
    propostaId: event.proposta.id,
    valid: isValid,
  });

  return {
    status: isValid ? Status.EmValidacao : Status.Rejeitada,
    reasons: [...validation.errors, ...ruleResult.reasons],
  };
});
