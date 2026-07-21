using Acme.Shared.Domain;

namespace Acme.Shared.Domain.Test;

public class PropostaTests
{
    private static Proposta Sample(Status status = Status.Received) => new()
    {
        Id = "p-1",
        Workflow = "workflow-a",
        Valor = 150_000,
        Status = status,
        Cliente = new Cliente { Id = "c-1", Nome = "Ana", Documento = "52998224725" },
    };

    [Fact]
    public void New_Proposta_Defaults_To_Received()
    {
        var proposta = Sample();
        Assert.Equal(Status.Received, proposta.Status);
        Assert.False(proposta.IsTerminal);
    }

    [Theory]
    [InlineData(Status.Finalized, true)]
    [InlineData(Status.Rejected, true)]
    [InlineData(Status.InReview, false)]
    public void IsTerminal_Is_True_Only_For_Finalized_And_Rejected(Status status, bool expected)
    {
        Assert.Equal(expected, Sample(status).IsTerminal);
    }
}
