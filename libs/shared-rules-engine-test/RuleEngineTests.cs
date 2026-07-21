using Acme.Shared.Domain;
using Acme.Shared.RulesEngine;

namespace Acme.Shared.RulesEngine.Test;

public class RuleEngineTests
{
    private static Proposta Proposta(long valor) => new()
    {
        Id = "p-1",
        Workflow = "workflow-a",
        Valor = valor,
        Cliente = new Cliente { Id = "c-1", Nome = "Ana", Documento = "52998224725" },
    };

    [Fact]
    public void Passes_When_Every_Rule_Passes()
    {
        var engine = new RuleEngine<Proposta>().Add(new MinimumValueRule(1000));
        var outcome = engine.Run(Proposta(5000));

        Assert.True(outcome.Passed);
        Assert.Empty(outcome.Failures);
    }

    [Fact]
    public void Collects_Failures_With_Reasons()
    {
        var engine = new RuleEngine<Proposta>().Add(new MinimumValueRule(1000));
        var outcome = engine.Run(Proposta(500));

        Assert.False(outcome.Passed);
        Assert.Equal(new[] { "minimum-value" }, outcome.Failures);
        Assert.Contains("abaixo do mínimo", outcome.Results[0].Reason);
    }
}
