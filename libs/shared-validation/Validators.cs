using System.Text.RegularExpressions;
using Acme.Shared.Domain;

namespace Acme.Shared.Validation;

public sealed record ValidationResult(bool Valid, IReadOnlyList<string> Errors);

/// <summary>
/// Data and identity validation helpers. Dependency-free so any workflow can
/// validate inbound payloads before doing real work.
/// </summary>
public static partial class Validators
{
    /// <summary>Validate a Brazilian CPF (11 digits) using the check-digit algorithm.</summary>
    public static bool IsValidCpf(string value)
    {
        var cpf = new string(value.Where(char.IsDigit).ToArray());
        if (cpf.Length != 11 || cpf.All(c => c == cpf[0]))
        {
            return false;
        }

        int CheckDigit(int length)
        {
            var sum = 0;
            var factor = length + 1;
            for (var i = 0; i < length; i++)
            {
                sum += (cpf[i] - '0') * (factor - i);
            }
            var rest = sum * 10 % 11;
            return rest == 10 ? 0 : rest;
        }

        return CheckDigit(9) == cpf[9] - '0' && CheckDigit(10) == cpf[10] - '0';
    }

    public static bool IsValidEmail(string value) => EmailRegex().IsMatch(value);

    /// <summary>Validate the identity fields of a <see cref="Cliente"/>.</summary>
    public static ValidationResult ValidateIdentity(Cliente cliente)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(cliente.Nome))
        {
            errors.Add("nome is required");
        }
        if (!IsValidCpf(cliente.Documento))
        {
            errors.Add("documento is not a valid CPF");
        }
        if (cliente.Email is not null && !IsValidEmail(cliente.Email))
        {
            errors.Add("email is malformed");
        }
        return new ValidationResult(errors.Count == 0, errors);
    }

    public static ValidationResult ValidateProposta(Proposta proposta)
    {
        var errors = new List<string>();
        if (proposta.Valor <= 0)
        {
            errors.Add("valor must be positive");
        }
        errors.AddRange(ValidateIdentity(proposta.Cliente).Errors);
        return new ValidationResult(errors.Count == 0, errors);
    }

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailRegex();
}
