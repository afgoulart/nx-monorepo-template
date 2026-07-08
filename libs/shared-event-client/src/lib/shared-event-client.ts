import { type Proposta } from 'shared-domain';

export interface EventEnvelope {
  workflow: Proposta['workflow'];
  propostaId: string;
}

export interface WorkflowRouting {
  workflow: Proposta['workflow'];
  queueName: string;
}

export class WorkflowEventClient {
  constructor(
    private readonly workflowQueues: Partial<Record<Proposta['workflow'], string>>
  ) {}

  routeEvent(event: EventEnvelope): WorkflowRouting {
    const queueName = this.workflowQueues[event.workflow];
    if (!queueName) {
      throw new Error(`No queue configured for workflow: ${event.workflow}`);
    }

    return {
      workflow: event.workflow,
      queueName,
    };
  }
}

export function sharedEventClient(): string {
  return 'shared-event-client';
}
