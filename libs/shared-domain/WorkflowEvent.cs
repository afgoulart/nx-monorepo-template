namespace Acme.Shared.Domain;

/// <summary>
/// Envelope for every message that travels on the shared event topic.
/// The <see cref="Workflow"/> field is the routing key: the event client uses
/// it to dispatch the message to the correct workflow handler.
/// </summary>
/// <typeparam name="TPayload">The domain payload carried by the event.</typeparam>
public sealed record WorkflowEvent<TPayload>
{
    public required string EventId { get; init; }

    /// <summary>Routing key: the workflow this event belongs to (e.g. "workflow-a").</summary>
    public required string Workflow { get; init; }

    /// <summary>Domain event name, e.g. "proposta.received".</summary>
    public required string Type { get; init; }

    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;

    public required TPayload Payload { get; init; }
}
