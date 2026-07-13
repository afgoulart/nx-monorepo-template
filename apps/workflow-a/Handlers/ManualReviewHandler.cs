using Amazon.Lambda.Core;
using Acme.Shared.Domain;
using Acme.Shared.Observability;

namespace Acme.WorkflowA.Handlers;

/// <summary>
/// Applies a human reviewer's decision to a proposal that was flagged InReview.
/// </summary>
public sealed class ManualReviewHandler
{
    private static readonly IStructuredLogger Logger = StructuredLogger.Create(
        new Dictionary<string, object?> { ["service"] = WorkflowConstants.Name, ["handler"] = "manual-review" });

    public Task<StepResult> Handle(ManualReviewInput input, ILambdaContext context)
    {
        var proposta = input.Proposta;
        var status = input.Review.Approve ? Status.Approved : Status.Rejected;

        Logger.Info("proposta.reviewed", new Dictionary<string, object?>
        {
            ["requestId"] = context.AwsRequestId,
            ["propostaId"] = proposta.Id,
            ["reviewer"] = input.Review.Reviewer,
            ["status"] = status.ToString(),
        });

        return Task.FromResult(new StepResult(
            WorkflowConstants.Name, "manual-review", proposta.Id, status,
            new Dictionary<string, object?> { ["reviewer"] = input.Review.Reviewer }));
    }
}
