import { createLogger, type Logger } from './logger.js';

/**
 * Minimal tracing wrapper.
 *
 * Wraps an async unit of work in a "span": it records duration and outcome and
 * logs them in a structured way. In a real deployment you would back this with
 * AWS X-Ray / OpenTelemetry; the interface is kept intentionally small so the
 * implementation can be swapped without touching call sites.
 */
export interface SpanContext {
  name: string;
  logger: Logger;
}

export async function withSpan<T>(
  name: string,
  fn: (ctx: SpanContext) => Promise<T> | T,
  logger: Logger = createLogger()
): Promise<T> {
  const spanLogger = logger.child({ span: name });
  const start = Date.now();
  spanLogger.debug('span.start');
  try {
    const result = await fn({ name, logger: spanLogger });
    spanLogger.info('span.end', { durationMs: Date.now() - start, ok: true });
    return result;
  } catch (error) {
    spanLogger.error('span.error', {
      durationMs: Date.now() - start,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
