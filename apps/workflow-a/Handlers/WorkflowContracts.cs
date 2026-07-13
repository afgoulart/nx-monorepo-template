using Amazon.Lambda.Core;
using Acme.Shared.Domain;

// Registers the default System.Text.Json serializer for every handler in this
// Lambda assembly.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace Acme.WorkflowA.Handlers;

public static class WorkflowConstants
{
    public const string Name = "workflow-a";

    /// <summary>
    /// Business threshold specific to workflow-a. Keeping it local (rather than
    /// in a shared lib) is the point of the architecture: each workflow tunes
    /// its own rules without affecting the others.
    /// </summary>
    public const long MinValor = 100_000;
}

public sealed record StepResult(
    string Workflow,
    string Step,
    string PropostaId,
    Status Status,
    IReadOnlyDictionary<string, object?>? Detail = null);

public sealed record ReviewDecision(bool Approve, string Reviewer);

/// <summary>Input for the manual-review step: the proposal plus a human decision.</summary>
public sealed record ManualReviewInput(Proposta Proposta, ReviewDecision Review);
