import { createEventConsumer } from './event-consumer.js';
import { createEventRouter, parseEvent } from './event-router.js';

describe('shared-event-client', () => {
  it('routes an event to the handler registered for its workflow', async () => {
    const seen: string[] = [];
    const router = createEventRouter()
      .on('workflow-a', () => void seen.push('a'))
      .on('workflow-b', () => void seen.push('b'));

    const result = await router.route({
      eventId: 'e-1',
      workflow: 'workflow-b',
      type: 'proposta.received',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {},
    });

    expect(result).toEqual({ status: 'handled', workflow: 'workflow-b' });
    expect(seen).toEqual(['b']);
  });

  it('reports unrouted events instead of throwing', async () => {
    const router = createEventRouter();
    const result = await router.route({
      eventId: 'e-1',
      workflow: 'workflow-x',
      type: 't',
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {},
    });
    expect(result.status).toBe('unrouted');
  });

  it('parseEvent rejects messages without a workflow', () => {
    expect(() => parseEvent(JSON.stringify({ type: 't' }))).toThrow(/workflow/);
  });

  it('consumer dispatches raw messages through the router', async () => {
    const consumer = createEventConsumer({
      brokers: ['localhost:9092'],
      topic: 'workflows.events',
      groupId: 'test',
    });
    const seen: string[] = [];
    consumer.router.on('workflow-a', (e) => void seen.push(e.type));

    await consumer.handleMessage(
      JSON.stringify({ workflow: 'workflow-a', type: 'proposta.received', payload: {} })
    );

    expect(seen).toEqual(['proposta.received']);
  });
});
