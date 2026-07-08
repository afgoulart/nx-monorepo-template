export type LogContext = object;

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export function createLogger(scope: string): Logger {
  return {
    info(message: string, context?: LogContext): void {
      console.info(JSON.stringify({ level: 'info', scope, message, context }));
    },
    warn(message: string, context?: LogContext): void {
      console.warn(JSON.stringify({ level: 'warn', scope, message, context }));
    },
    error(message: string, context?: LogContext): void {
      console.error(JSON.stringify({ level: 'error', scope, message, context }));
    },
  };
}

export function withTrace<TEvent, TResult>(
  traceName: string,
  handler: (event: TEvent) => Promise<TResult>
): (event: TEvent) => Promise<TResult> {
  return async (event: TEvent): Promise<TResult> => {
    const logger = createLogger('trace');
    logger.info('trace.start', { traceName });
    try {
      return await handler(event);
    } finally {
      logger.info('trace.end', { traceName });
    }
  };
}

export function sharedObservability(): string {
  return 'shared-observability';
}
