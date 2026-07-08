import { Status } from 'shared-domain';
import { evaluateFraudRisk, sharedFraudEngine } from './shared-fraud-engine';

describe('sharedFraudEngine', () => {
  it('should work', () => {
    expect(sharedFraudEngine()).toEqual('shared-fraud-engine');
  });

  it('returns low risk at threshold and below', () => {
    const result = evaluateFraudRisk({
      id: 'p-1',
      workflow: 'workflow-a',
      status: Status.Recebida,
      cliente: { id: 'c-1', nome: 'Cliente', documento: '123' },
      valorSolicitado: 50000,
    });

    expect(result.riskLevel).toBe('low');
  });

  it('returns medium risk above threshold', () => {
    const result = evaluateFraudRisk({
      id: 'p-2',
      workflow: 'workflow-a',
      status: Status.Recebida,
      cliente: { id: 'c-1', nome: 'Cliente', documento: '123' },
      valorSolicitado: 50001,
    });

    expect(result.riskLevel).toBe('medium');
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
