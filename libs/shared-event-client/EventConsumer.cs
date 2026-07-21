using System.Collections.Generic;
using Acme.Shared.Observability;

namespace Acme.Shared.EventClient;

/// <param name="Topic">The single shared topic every workflow reads from.</param>
public sealed record KafkaConsumerConfig(IReadOnlyList<string> Brokers, string Topic, string GroupId);

/// <summary>
/// Thin abstraction over the message broker (Kafka in the reference setup). The
/// concrete transport is intentionally a stub: swap <see cref="StartAsync"/> for
/// a real Kafka consumer without changing any workflow code. A single consumer
/// subscribes to one topic and delegates routing to the shared EventRouter.
/// </summary>
public sealed class EventConsumer
{
    private readonly KafkaConsumerConfig _config;
    private readonly IStructuredLogger _logger;

    public EventRouter Router { get; } = new();

    public EventConsumer(KafkaConsumerConfig config, IStructuredLogger? logger = null)
    {
        _config = config;
        _logger = logger ?? StructuredLogger.Create(new Dictionary<string, object?>
        {
            ["component"] = "event-consumer",
        });
    }

    /// <summary>Deliver a single raw message through parsing + routing.</summary>
    public async Task HandleMessageAsync(string raw)
    {
        var evt = EventRouter.ParseEvent(raw);
        var result = await Router.RouteAsync(evt);
        var fields = new Dictionary<string, object?> { ["workflow"] = evt.Workflow, ["type"] = evt.Type };
        if (result.Status == RouteStatus.Unrouted)
        {
            _logger.Warn("event.unrouted", fields);
        }
        else
        {
            _logger.Info("event.handled", fields);
        }
    }

    /// <summary>
    /// Start consuming from the broker (stub — wire a real Kafka client here).
    /// In production, connect the client and pipe each message through
    /// <see cref="HandleMessageAsync"/>.
    /// </summary>
    public Task StartAsync()
    {
        _logger.Info("event-consumer.start (stub)", new Dictionary<string, object?>
        {
            ["topic"] = _config.Topic,
            ["brokers"] = _config.Brokers.Count,
        });
        return Task.CompletedTask;
    }
}
