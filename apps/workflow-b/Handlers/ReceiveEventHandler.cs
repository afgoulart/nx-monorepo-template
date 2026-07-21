using Amazon.Lambda.Core;
using Acme.Shared.Domain;
using Acme.Shared.Observability;

namespace Acme.WorkflowB.Handlers;

/// <summary>
/// Entry point of the workflow: acknowledges an incoming proposal event and
/// marks it Received. In production this is triggered by the workflow's SQS /
/// EventBridge source (see infra/workflow-b/terraform).
/// </summary>
public sealed class ReceiveEventHandler
{
    private static readonly IStructuredLogger Logger = StructuredLogger.Create(
        new Dictionary<string, object?> { ["service"] = WorkflowConstants.Name, ["handler"] = "receive-event" });

    public Task<StepResult> Handle(WorkflowEvent<Proposta> evt, ILambdaContext context)
    {
        var proposta = evt.Payload;
        Logger.Info("proposta.received", new Dictionary<string, object?>
        {
            ["requestId"] = context.AwsRequestId,
            ["propostaId"] = proposta.Id,
            ["valor"] = proposta.Valor,
        });

        return Task.FromResult(new StepResult(
            WorkflowConstants.Name, "receive-event", proposta.Id, Status.Received));
    }
}
