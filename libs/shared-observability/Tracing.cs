using System.Diagnostics;

namespace Acme.Shared.Observability;

/// <summary>
/// Minimal tracing wrapper. Wraps a unit of work in a "span": it records
/// duration and outcome and logs them in a structured way. In a real deployment
/// you would back this with AWS X-Ray / OpenTelemetry; the surface is kept small
/// so the implementation can be swapped without touching call sites.
/// </summary>
public static class Tracing
{
    public static async Task<T> WithSpanAsync<T>(
        string name,
        IStructuredLogger logger,
        Func<IStructuredLogger, Task<T>> work)
    {
        var span = logger.With(new Dictionary<string, object?> { ["span"] = name });
        var stopwatch = Stopwatch.StartNew();
        span.Debug("span.start");
        try
        {
            var result = await work(span);
            span.Info("span.end", new Dictionary<string, object?>
            {
                ["durationMs"] = stopwatch.ElapsedMilliseconds,
                ["ok"] = true,
            });
            return result;
        }
        catch (Exception ex)
        {
            span.Error("span.error", new Dictionary<string, object?>
            {
                ["durationMs"] = stopwatch.ElapsedMilliseconds,
                ["ok"] = false,
                ["error"] = ex.Message,
            });
            throw;
        }
    }
}
