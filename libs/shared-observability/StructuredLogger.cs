using System.Text.Json;

namespace Acme.Shared.Observability;

public enum LogLevel
{
    Debug = 10,
    Info = 20,
    Warn = 30,
    Error = 40,
}

/// <summary>
/// Structured JSON logger. Emits one JSON object per line to stdout — the shape
/// CloudWatch Logs Insights expects. A logger carries a bag of context fields
/// (service, workflow, requestId, ...) merged into every line; <see cref="With"/>
/// derives a new logger with extra fields bound.
/// </summary>
public interface IStructuredLogger
{
    void Log(LogLevel level, string message, IReadOnlyDictionary<string, object?>? fields = null);
    IStructuredLogger With(IReadOnlyDictionary<string, object?> fields);

    void Debug(string message, IReadOnlyDictionary<string, object?>? fields = null) => Log(LogLevel.Debug, message, fields);
    void Info(string message, IReadOnlyDictionary<string, object?>? fields = null) => Log(LogLevel.Info, message, fields);
    void Warn(string message, IReadOnlyDictionary<string, object?>? fields = null) => Log(LogLevel.Warn, message, fields);
    void Error(string message, IReadOnlyDictionary<string, object?>? fields = null) => Log(LogLevel.Error, message, fields);
}

public sealed class StructuredLogger : IStructuredLogger
{
    private readonly IReadOnlyDictionary<string, object?> _context;
    private readonly LogLevel _minLevel;
    private readonly TextWriter _sink;

    private StructuredLogger(
        IReadOnlyDictionary<string, object?> context,
        LogLevel minLevel,
        TextWriter sink)
    {
        _context = context;
        _minLevel = minLevel;
        _sink = sink;
    }

    /// <summary>
    /// Creates a logger. The minimum level defaults to the LOG_LEVEL environment
    /// variable, then Info. A custom <paramref name="sink"/> is mainly for tests.
    /// </summary>
    public static StructuredLogger Create(
        IReadOnlyDictionary<string, object?>? context = null,
        LogLevel? minLevel = null,
        TextWriter? sink = null)
    {
        var level = minLevel ?? ParseLevel(Environment.GetEnvironmentVariable("LOG_LEVEL")) ?? LogLevel.Info;
        return new StructuredLogger(
            context ?? new Dictionary<string, object?>(),
            level,
            sink ?? Console.Out);
    }

    public void Log(LogLevel level, string message, IReadOnlyDictionary<string, object?>? fields = null)
    {
        if (level < _minLevel)
        {
            return;
        }

        var entry = new Dictionary<string, object?>
        {
            ["level"] = level.ToString().ToLowerInvariant(),
            ["message"] = message,
            ["timestamp"] = DateTimeOffset.UtcNow.ToString("O"),
        };
        foreach (var (k, v) in _context)
        {
            entry[k] = v;
        }
        if (fields is not null)
        {
            foreach (var (k, v) in fields)
            {
                entry[k] = v;
            }
        }

        _sink.WriteLine(JsonSerializer.Serialize(entry));
    }

    public IStructuredLogger With(IReadOnlyDictionary<string, object?> fields)
    {
        var merged = new Dictionary<string, object?>(_context);
        foreach (var (k, v) in fields)
        {
            merged[k] = v;
        }
        return new StructuredLogger(merged, _minLevel, _sink);
    }

    private static LogLevel? ParseLevel(string? value) =>
        Enum.TryParse<LogLevel>(value, ignoreCase: true, out var parsed) ? parsed : null;
}
