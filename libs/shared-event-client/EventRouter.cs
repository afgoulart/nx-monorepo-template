using System.Text.Json;
using Acme.Shared.Domain;

namespace Acme.Shared.EventClient;

public enum RouteStatus
{
    Handled,
    Unrouted,
}

public sealed record RouteResult(RouteStatus Status, string Workflow);

/// <summary>
/// Routing layer for the single shared event topic. Every workflow publishes to
/// and consumes from one topic (e.g. a Kafka topic "workflows.events"). The
/// router inspects the envelope's <c>Workflow</c> field and dispatches the event
/// to the handler registered for that workflow, so a single consumer process can
/// fan messages out to the right workflow logic.
/// </summary>
public sealed class EventRouter
{
    private readonly Dictionary<string, Func<WorkflowEvent<JsonElement>, Task>> _handlers = new();

    public EventRouter On(string workflow, Func<WorkflowEvent<JsonElement>, Task> handler)
    {
        _handlers[workflow] = handler;
        return this;
    }

    public async Task<RouteResult> RouteAsync(WorkflowEvent<JsonElement> evt)
    {
        if (!_handlers.TryGetValue(evt.Workflow, out var handler))
        {
            return new RouteResult(RouteStatus.Unrouted, evt.Workflow);
        }

        await handler(evt);
        return new RouteResult(RouteStatus.Handled, evt.Workflow);
    }

    /// <summary>Parse and validate a raw topic message into a WorkflowEvent.</summary>
    public static WorkflowEvent<JsonElement> ParseEvent(string raw)
    {
        using var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;

        if (!root.TryGetProperty("workflow", out var workflow) ||
            workflow.ValueKind != JsonValueKind.String ||
            !root.TryGetProperty("type", out var type) ||
            type.ValueKind != JsonValueKind.String)
        {
            throw new FormatException("invalid event: missing \"workflow\" or \"type\"");
        }

        return new WorkflowEvent<JsonElement>
        {
            EventId = root.TryGetProperty("eventId", out var id) && id.ValueKind == JsonValueKind.String
                ? id.GetString()!
                : Guid.NewGuid().ToString(),
            Workflow = workflow.GetString()!,
            Type = type.GetString()!,
            OccurredAt = root.TryGetProperty("occurredAt", out var at) && at.ValueKind == JsonValueKind.String
                ? DateTimeOffset.Parse(at.GetString()!)
                : DateTimeOffset.UtcNow,
            Payload = root.TryGetProperty("payload", out var payload) ? payload.Clone() : default,
        };
    }
}
