import { WorkflowEventClient, sharedEventClient } from './shared-event-client';

describe('sharedEventClient', () => {
  it('should work', () => {
    expect(sharedEventClient()).toEqual('shared-event-client');
  });

  it('routes events to workflow queue', () => {
    const client = new WorkflowEventClient({
      'workflow-a': 'queue-a',
      'workflow-b': 'queue-b',
    });

    expect(client.routeEvent({ workflow: 'workflow-b', propostaId: 'p-1' })).toEqual({
      workflow: 'workflow-b',
      queueName: 'queue-b',
    });
  });

  it('throws when queue is not configured', () => {
    const client = new WorkflowEventClient({
      'workflow-a': 'queue-a',
    });

    expect(() => client.routeEvent({ workflow: 'workflow-b', propostaId: 'p-2' })).toThrow(
      'No queue configured for workflow: workflow-b'
    );
  });
});
