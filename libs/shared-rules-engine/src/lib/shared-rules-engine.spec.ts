import { RuleEngine, sharedRulesEngine, type RuleInput } from './shared-rules-engine';
import { Status } from 'shared-domain';

describe('sharedRulesEngine', () => {
  it('should work', () => {
    expect(sharedRulesEngine()).toEqual('shared-rules-engine');
  });

  it('evaluates default rules', () => {
    const engine = new RuleEngine<RuleInput>();
    const result = engine.evaluate({
      eventName: 'validate',
      proposta: {
        id: 'p-1',
        workflow: 'workflow-a',
        status: Status.Recebida,
        cliente: { id: 'c-1', nome: 'Cliente', documento: '123' },
        valorSolicitado: 10,
      },
    });

    expect(result.approved).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
