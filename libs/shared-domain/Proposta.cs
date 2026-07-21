namespace Acme.Shared.Domain;

/// <summary>Lifecycle a proposal moves through, regardless of the workflow.</summary>
public enum Status
{
    Received,
    Validating,
    InReview,
    Approved,
    Rejected,
    Finalized,
}

/// <summary>The person/company a proposal belongs to.</summary>
public sealed record Cliente
{
    public required string Id { get; init; }
    public required string Nome { get; init; }

    /// <summary>CPF or CNPJ, digits only.</summary>
    public required string Documento { get; init; }

    public string? Email { get; init; }

    /// <summary>ISO-8601 date (yyyy-MM-dd).</summary>
    public string? Nascimento { get; init; }
}

/// <summary>
/// A proposal is the unit of work that flows through a workflow: it is
/// received, validated, optionally sent to manual review and finalized.
/// </summary>
public sealed record Proposta
{
    public required string Id { get; init; }

    /// <summary>Which workflow owns this proposal (used for routing).</summary>
    public required string Workflow { get; init; }

    public required Cliente Cliente { get; init; }

    /// <summary>Monetary amount in the smallest currency unit (centavos).</summary>
    public required long Valor { get; init; }

    public Status Status { get; init; } = Status.Received;

    public DateTimeOffset CriadoEm { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset AtualizadoEm { get; init; } = DateTimeOffset.UtcNow;

    public IReadOnlyDictionary<string, object>? Metadata { get; init; }

    /// <summary>Statuses from which a proposal can no longer transition.</summary>
    public bool IsTerminal => Status is Status.Finalized or Status.Rejected;
}
