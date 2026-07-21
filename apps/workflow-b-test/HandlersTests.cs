using Amazon.Lambda.TestUtilities;
using Acme.Shared.Domain;
using Acme.WorkflowB.Handlers;

namespace Acme.WorkflowB.Test;

public class HandlersTests
{
    private static readonly TestLambdaContext Context = new() { AwsRequestId = "test-req" };

    private static Proposta Proposta(long valor = WorkflowConstants.MinValor) => new()
    {
        Id = "p-1",
        Workflow = WorkflowConstants.Name,
        Valor = valor,
        // 529.982.247-25 is a structurally valid CPF used for tests.
        Cliente = new Cliente { Id = "c-1", Nome = "Ana", Documento = "52998224725" },
    };

    private static WorkflowEvent<Proposta> Event(long valor = WorkflowConstants.MinValor) => new()
    {
        EventId = "e-1",
        Workflow = WorkflowConstants.Name,
        Type = "proposta.received",
        Payload = Proposta(valor),
    };

    [Fact]
    public async Task ReceiveEvent_Acknowledges_As_Received()
    {
        var result = await new ReceiveEventHandler().Handle(Event(), Context);
        Assert.Equal("receive-event", result.Step);
        Assert.Equal(Status.Received, result.Status);
    }

    [Fact]
    public async Task Validate_Approves_A_Clean_Proposal_At_Threshold()
    {
        var result = await new ValidateHandler().Handle(Event(), Context);
        Assert.Equal(Status.Approved, result.Status);
    }

    [Fact]
    public async Task Validate_Rejects_Below_The_Workflow_Threshold()
    {
        var result = await new ValidateHandler().Handle(Event(WorkflowConstants.MinValor - 1), Context);
        Assert.Equal(Status.Rejected, result.Status);
    }

    [Fact]
    public async Task ManualReview_Honors_The_Reviewer_Decision()
    {
        var input = new ManualReviewInput(Proposta(), new ReviewDecision(true, "ana"));
        var result = await new ManualReviewHandler().Handle(input, Context);
        Assert.Equal(Status.Approved, result.Status);
    }

    [Fact]
    public async Task Finalize_Marks_The_Proposal_Finalized()
    {
        var result = await new FinalizeHandler().Handle(Event(), Context);
        Assert.Equal(Status.Finalized, result.Status);
    }
}
