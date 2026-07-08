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
    private readonly workflowQueues: Record<Proposta['workflow'], string>
  ) {}

  routeEvent(event: EventEnvelope): WorkflowRouting {
    return {
      workflow: event.workflow,
      queueName: this.workflowQueues[event.workflow],
    };
  }
}

export function sharedEventClient(): string {
  return 'shared-event-client';
}
