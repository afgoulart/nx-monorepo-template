import type { Proposta } from '@org/shared-domain';
import { createRuleEngine } from './rule-engine.js';
import { minimumValueRule } from './rules.js';

function proposta(valor: number): Proposta {
  return {
    id: 'p-1',
    workflow: 'workflow-a',
    valor,
    status: 'RECEIVED',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
    cliente: { id: 'c-1', nome: 'Ana', documento: '12345678900' },
  };
}

describe('shared-rules-engine', () => {
  it('passes when every rule passes', async () => {
    const engine = createRuleEngine<Proposta>().add(minimumValueRule(1000));
    const outcome = await engine.run(proposta(5000));

    expect(outcome.passed).toBe(true);
    expect(outcome.failures).toEqual([]);
  });

  it('collects failures with reasons', async () => {
    const engine = createRuleEngine<Proposta>([minimumValueRule(1000)]);
    const outcome = await engine.run(proposta(500));

    expect(outcome.passed).toBe(false);
    expect(outcome.failures).toEqual(['minimum-value']);
    expect(outcome.results[0].reason).toContain('abaixo do mínimo');
  });
});
