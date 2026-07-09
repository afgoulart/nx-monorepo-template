/**
 * Structured JSON logger.
 *
 * Emits one JSON object per line to stdout/stderr — the shape CloudWatch Logs
 * Insights and most log processors expect. A logger carries a bag of context
 * fields (service, workflow, requestId, ...) that are merged into every line;
 * `child()` derives a new logger with extra fields bound.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Derive a logger with additional context bound to every line. */
  child(fields: LogFields): Logger;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LoggerOptions {
  /** Minimum level to emit. Defaults to LOG_LEVEL env var, then "info". */
  level?: LogLevel;
  /** Injectable sink, mainly for testing. Defaults to console. */
  sink?: (level: LogLevel, line: string) => void;
}

function defaultSink(level: LogLevel, line: string): void {
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(
  context: LogFields = {},
  options: LoggerOptions = {}
): Logger {
  const minLevel =
    options.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
  const sink = options.sink ?? defaultSink;

  function log(level: LogLevel, message: string, fields?: LogFields): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) {
      return;
    }
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
      ...fields,
    };
    sink(level, JSON.stringify(entry));
  }

  return {
    debug: (message, fields) => log('debug', message, fields),
    info: (message, fields) => log('info', message, fields),
    warn: (message, fields) => log('warn', message, fields),
    error: (message, fields) => log('error', message, fields),
    child: (fields) => createLogger({ ...context, ...fields }, options),
  };
}
