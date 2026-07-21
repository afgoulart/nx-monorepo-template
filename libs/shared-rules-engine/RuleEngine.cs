namespace Acme.Shared.RulesEngine;

public sealed record RuleResult(bool Passed, string? Reason = null);

/// <summary>A named predicate over some input.</summary>
public interface IRule<in TInput>
{
    string Name { get; }
    RuleResult Evaluate(TInput input);
}

public sealed record EvaluatedRule(string Rule, bool Passed, string? Reason);

public sealed record RuleOutcome(
    bool Passed,
    IReadOnlyList<EvaluatedRule> Results,
    IReadOnlyList<string> Failures);

/// <summary>
/// Generic, composable rule engine. Runs a set of rules over an input and
/// aggregates the outcome. Generic over the input type so each workflow can
/// bring its own domain object while reusing the same engine.
/// </summary>
public sealed class RuleEngine<TInput>
{
    private readonly List<IRule<TInput>> _rules = new();

    public RuleEngine<TInput> Add(IRule<TInput> rule)
    {
        _rules.Add(rule);
        return this;
    }

    public RuleOutcome Run(TInput input)
    {
        var results = _rules
            .Select(rule =>
            {
                var result = rule.Evaluate(input);
                return new EvaluatedRule(rule.Name, result.Passed, result.Reason);
            })
            .ToList();

        var failures = results.Where(r => !r.Passed).Select(r => r.Rule).ToList();
        return new RuleOutcome(failures.Count == 0, results, failures);
    }
}
