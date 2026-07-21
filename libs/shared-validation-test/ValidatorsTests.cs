using Acme.Shared.Domain;
using Acme.Shared.Validation;

namespace Acme.Shared.Validation.Test;

public class ValidatorsTests
{
    [Theory]
    [InlineData("529.982.247-25", true)]
    [InlineData("111.111.111-11", false)]
    [InlineData("123", false)]
    public void Validates_Cpf_Check_Digits(string cpf, bool expected)
    {
        Assert.Equal(expected, Validators.IsValidCpf(cpf));
    }

    [Fact]
    public void Collects_Proposta_Errors()
    {
        var proposta = new Proposta
        {
            Id = "p-1",
            Workflow = "workflow-a",
            Valor = -1,
            Cliente = new Cliente { Id = "c-1", Nome = "", Documento = "000" },
        };

        var result = Validators.ValidateProposta(proposta);

        Assert.False(result.Valid);
        Assert.Contains("valor must be positive", result.Errors);
        Assert.Contains("nome is required", result.Errors);
        Assert.Contains("documento is not a valid CPF", result.Errors);
    }
}
