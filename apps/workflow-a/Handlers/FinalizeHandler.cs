using Amazon.Lambda.Core;
using Acme.Shared.Domain;
using Acme.Shared.Observability;

namespace Acme.WorkflowA.Handlers;

/// <summary>
/// Terminal step: persists the final outcome and (in production) would emit a
/// "proposta.finalized" event back onto the shared topic for downstream
/// consumers. Here we log and return the finalized result.
/// </summary>
public sealed class FinalizeHandler
{
    private static readonly IStructuredLogger Logger = StructuredLogger.Create(
        new Dictionary<string, object?> { ["service"] = WorkflowConstants.Name, ["handler"] = "finalize" });

    public Task<StepResult> Handle(WorkflowEvent<Proposta> evt, ILambdaContext context)
    {
        var proposta = evt.Payload;

        Logger.Info("proposta.finalized", new Dictionary<string, object?>
        {
            ["requestId"] = context.AwsRequestId,
            ["propostaId"] = proposta.Id,
            ["outcome"] = proposta.Status.ToString(),
        });

        return Task.FromResult(new StepResult(
            WorkflowConstants.Name, "finalize", proposta.Id, Status.Finalized,
            new Dictionary<string, object?> { ["outcome"] = proposta.Status.ToString() }));
    }
}
