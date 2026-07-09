import type { Proposta } from '@org/shared-domain';
import type { Rule } from './rule-engine.js';

/**
 * Example rule: a proposal must have a value of at least `min`.
 * Serves as a template for real business rules.
 */
export function minimumValueRule(min: number): Rule<Proposta> {
  return {
    name: 'minimum-value',
    evaluate: (proposta) =>
      proposta.valor >= min
        ? { passed: true }
        : { passed: false, reason: `valor ${proposta.valor} abaixo do mínimo ${min}` },
  };
}
