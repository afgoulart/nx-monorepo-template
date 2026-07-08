import { type Proposta } from 'shared-domain';

export interface RuleInput {
  proposta: Proposta;
  eventName: string;
}

export interface Rule<TInput> {
  name: string;
  evaluate(input: TInput): { passed: boolean; reason?: string };
}

export interface RuleEngineResult {
  approved: boolean;
  reasons: string[];
}

export class MinValueRule implements Rule<RuleInput> {
  readonly name = 'min-value-rule';

  constructor(private readonly minimumValue = 100) {}

  evaluate(input: RuleInput): { passed: boolean; reason?: string } {
    const passed = input.proposta.valorSolicitado >= this.minimumValue;
    return {
      passed,
      reason: passed ? undefined : `Valor mínimo não atingido: ${this.minimumValue}`,
    };
  }
}

export class RuleEngine<TInput extends RuleInput> {
  constructor(private readonly rules: Rule<TInput>[] = [new MinValueRule() as Rule<TInput>]) {}

  evaluate(input: TInput): RuleEngineResult {
    const results = this.rules.map((rule) => rule.evaluate(input));
    return {
      approved: results.every((result) => result.passed),
      reasons: results.flatMap((result) => (result.reason ? [result.reason] : [])),
    };
  }
}

export function sharedRulesEngine(): string {
  return 'shared-rules-engine';
}
