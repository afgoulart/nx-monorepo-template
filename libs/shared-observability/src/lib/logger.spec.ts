import { createLogger, type LogLevel } from './logger.js';
import { withSpan } from './tracing.js';

function captureSink() {
  const lines: Array<{ level: LogLevel; entry: Record<string, unknown> }> = [];
  return {
    lines,
    sink: (level: LogLevel, line: string) =>
      lines.push({ level, entry: JSON.parse(line) }),
  };
}

describe('shared-observability', () => {
  it('emits structured JSON with merged context fields', () => {
    const { lines, sink } = captureSink();
    const logger = createLogger({ service: 'workflow-a' }, { level: 'debug', sink });

    logger.info('proposta.received', { propostaId: 'p-1' });

    expect(lines).toHaveLength(1);
    expect(lines[0].entry).toMatchObject({
      level: 'info',
      message: 'proposta.received',
      service: 'workflow-a',
      propostaId: 'p-1',
    });
  });

  it('respects the minimum level', () => {
    const { lines, sink } = captureSink();
    const logger = createLogger({}, { level: 'warn', sink });

    logger.info('ignored');
    logger.warn('kept');

    expect(lines.map((l) => l.entry['message'])).toEqual(['kept']);
  });

  it('withSpan records a successful span', async () => {
    const { lines, sink } = captureSink();
    const logger = createLogger({}, { level: 'debug', sink });

    const result = await withSpan('validate', () => 42, logger);

    expect(result).toBe(42);
    expect(lines.some((l) => l.entry['message'] === 'span.end')).toBe(true);
  });
});
