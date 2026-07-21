using System.Text.Json;
using Acme.Shared.Domain;
using Acme.Shared.EventClient;

namespace Acme.Shared.EventClient.Test;

public class EventRouterTests
{
    private static WorkflowEvent<JsonElement> Event(string workflow) => new()
    {
        EventId = "e-1",
        Workflow = workflow,
        Type = "proposta.received",
        Payload = default,
    };

    [Fact]
    public async Task Routes_Event_To_Handler_For_Its_Workflow()
    {
        var seen = new List<string>();
        var router = new EventRouter()
            .On("workflow-a", _ => { seen.Add("a"); return Task.CompletedTask; })
            .On("workflow-b", _ => { seen.Add("b"); return Task.CompletedTask; });

        var result = await router.RouteAsync(Event("workflow-b"));

        Assert.Equal(RouteStatus.Handled, result.Status);
        Assert.Equal(new[] { "b" }, seen);
    }

    [Fact]
    public async Task Reports_Unrouted_Events_Instead_Of_Throwing()
    {
        var result = await new EventRouter().RouteAsync(Event("workflow-x"));
        Assert.Equal(RouteStatus.Unrouted, result.Status);
    }

    [Fact]
    public void ParseEvent_Rejects_Messages_Without_A_Workflow()
    {
        Assert.Throws<FormatException>(() =>
            EventRouter.ParseEvent(JsonSerializer.Serialize(new { type = "t" })));
    }

    [Fact]
    public async Task Consumer_Dispatches_Raw_Messages_Through_The_Router()
    {
        var consumer = new EventConsumer(new KafkaConsumerConfig(
            new[] { "localhost:9092" }, "workflows.events", "test"));
        var seen = new List<string>();
        consumer.Router.On("workflow-a", e => { seen.Add(e.Type); return Task.CompletedTask; });

        await consumer.HandleMessageAsync(
            JsonSerializer.Serialize(new { workflow = "workflow-a", type = "proposta.received", payload = new { } }));

        Assert.Equal(new[] { "proposta.received" }, seen);
    }
}
