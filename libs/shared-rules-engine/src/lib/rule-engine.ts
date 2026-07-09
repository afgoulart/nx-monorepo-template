/**
 * Generic, composable rule engine.
 *
 * A `Rule` is a named predicate over some input that returns a `RuleResult`.
 * A `RuleEngine` runs a set of rules and aggregates the outcome. Both are
 * generic over the input type so each workflow can bring its own domain object
 * (a Proposta, a Cliente, ...) while reusing the same engine.
 */
export interface RuleResult {
  passed: boolean;
  /** Human-readable explanation, required when a rule fails. */
  reason?: string;
}

export interface Rule<TInput> {
  name: string;
  evaluate(input: TInput): RuleResult | Promise<RuleResult>;
}

export interface RuleOutcome {
  passed: boolean;
  results: Array<{ rule: string } & RuleResult>;
  /** Names of the rules that failed. */
  failures: string[];
}

export interface RuleEngine<TInput> {
  add(rule: Rule<TInput>): RuleEngine<TInput>;
  run(input: TInput): Promise<RuleOutcome>;
}

export function createRuleEngine<TInput>(
  initialRules: Array<Rule<TInput>> = []
): RuleEngine<TInput> {
  const rules: Array<Rule<TInput>> = [...initialRules];

  const engine: RuleEngine<TInput> = {
    add(rule) {
      rules.push(rule);
      return engine;
    },
    async run(input) {
      const results = await Promise.all(
        rules.map(async (rule) => ({
          rule: rule.name,
          ...(await rule.evaluate(input)),
        }))
      );
      const failures = results.filter((r) => !r.passed).map((r) => r.rule);
      return { passed: failures.length === 0, results, failures };
    },
  };

  return engine;
}
