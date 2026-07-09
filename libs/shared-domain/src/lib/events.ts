/**
 * Envelope for every message that travels on the shared event topic.
 *
 * The `workflow` field is the routing key: the shared event client uses it to
 * dispatch the message to the correct workflow handler.
 */
export interface WorkflowEvent<TPayload = unknown> {
  eventId: string;
  /** Routing key: the workflow this event belongs to (e.g. "workflow-a"). */
  workflow: string;
  /** Domain event name, e.g. "proposta.received". */
  type: string;
  /** ISO-8601 timestamp of when the event occurred. */
  occurredAt: string;
  payload: TPayload;
}
