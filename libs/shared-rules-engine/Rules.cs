using Acme.Shared.Domain;

namespace Acme.Shared.RulesEngine;

/// <summary>
/// Example rule: a proposal must have a value of at least <c>min</c>.
/// Serves as a template for real business rules.
/// </summary>
public sealed class MinimumValueRule : IRule<Proposta>
{
    private readonly long _min;

    public MinimumValueRule(long min) => _min = min;

    public string Name => "minimum-value";

    public RuleResult Evaluate(Proposta input) =>
        input.Valor >= _min
            ? new RuleResult(true)
            : new RuleResult(false, $"valor {input.Valor} abaixo do mínimo {_min}");
}
