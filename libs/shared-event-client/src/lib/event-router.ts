import type { WorkflowEvent } from '@org/shared-domain';

/**
 * Routing layer for the single shared event topic.
 *
 * Every workflow publishes to and consumes from one topic (e.g. a Kafka topic
 * "workflows.events"). The router inspects the envelope's `workflow` field and
 * dispatches the event to the handler registered for that workflow, so a single
 * consumer process can fan messages out to the right workflow logic.
 */
export type EventHandler<TPayload = unknown> = (
  event: WorkflowEvent<TPayload>
) => Promise<void> | void;

export type RouteResult =
  | { status: 'handled'; workflow: string }
  | { status: 'unrouted'; workflow: string };

export interface EventRouter {
  /** Register the handler for a given workflow. */
  on(workflow: string, handler: EventHandler): EventRouter;
  /** Dispatch a parsed event to its workflow handler. */
  route(event: WorkflowEvent): Promise<RouteResult>;
}

export function createEventRouter(): EventRouter {
  const handlers = new Map<string, EventHandler>();

  const router: EventRouter = {
    on(workflow, handler) {
      handlers.set(workflow, handler);
      return router;
    },
    async route(event) {
      const handler = handlers.get(event.workflow);
      if (!handler) {
        return { status: 'unrouted', workflow: event.workflow };
      }
      await handler(event);
      return { status: 'handled', workflow: event.workflow };
    },
  };

  return router;
}

/** Parse and validate a raw topic message into a WorkflowEvent. */
export function parseEvent(raw: string): WorkflowEvent {
  const data = JSON.parse(raw) as Partial<WorkflowEvent>;
  if (!data || typeof data.workflow !== 'string' || typeof data.type !== 'string') {
    throw new Error('invalid event: missing "workflow" or "type"');
  }
  return {
    eventId: data.eventId ?? crypto.randomUUID(),
    workflow: data.workflow,
    type: data.type,
    occurredAt: data.occurredAt ?? new Date().toISOString(),
    payload: data.payload,
  };
}
