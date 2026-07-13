using System.Text.Json;
using Acme.Shared.Observability;

namespace Acme.Shared.Observability.Test;

public class StructuredLoggerTests
{
    private static (StringWriter sink, IStructuredLogger logger) Make(LogLevel level = LogLevel.Debug)
    {
        var sink = new StringWriter();
        var logger = StructuredLogger.Create(
            new Dictionary<string, object?> { ["service"] = "workflow-a" }, level, sink);
        return (sink, logger);
    }

    private static List<Dictionary<string, JsonElement>> Lines(StringWriter sink) =>
        sink.ToString()
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(l)!)
            .ToList();

    [Fact]
    public void Emits_Structured_Json_With_Context()
    {
        var (sink, logger) = Make();
        logger.Info("proposta.received", new Dictionary<string, object?> { ["propostaId"] = "p-1" });

        var lines = Lines(sink);
        Assert.Single(lines);
        Assert.Equal("info", lines[0]["level"].GetString());
        Assert.Equal("workflow-a", lines[0]["service"].GetString());
        Assert.Equal("p-1", lines[0]["propostaId"].GetString());
    }

    [Fact]
    public void Respects_Minimum_Level()
    {
        var (sink, logger) = Make(LogLevel.Warn);
        logger.Info("ignored");
        logger.Warn("kept");

        var lines = Lines(sink);
        Assert.Single(lines);
        Assert.Equal("kept", lines[0]["message"].GetString());
    }

    [Fact]
    public async Task WithSpan_Records_A_Successful_Span()
    {
        var (sink, logger) = Make();
        var result = await Tracing.WithSpanAsync("validate", logger, _ => Task.FromResult(42));

        Assert.Equal(42, result);
        Assert.Contains(Lines(sink), l => l["message"].GetString() == "span.end");
    }
}
