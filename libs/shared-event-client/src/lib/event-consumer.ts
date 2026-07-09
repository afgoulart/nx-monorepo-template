import { createLogger, type Logger } from '@org/shared-observability';
import { createEventRouter, parseEvent, type EventRouter } from './event-router.js';

/**
 * Thin abstraction over the message broker (Kafka in the reference setup).
 *
 * The concrete transport is intentionally left as a stub: swap `run` for a
 * kafkajs consumer without changing any workflow code. The important part is
 * that a single consumer subscribes to one topic and delegates routing to the
 * shared EventRouter.
 */
export interface KafkaConsumerConfig {
  brokers: string[];
  /** The single shared topic every workflow reads from. */
  topic: string;
  groupId: string;
}

export interface EventConsumer {
  router: EventRouter;
  /** Deliver a single raw message through parsing + routing. */
  handleMessage(raw: string): Promise<void>;
  /** Start consuming from the broker (stub — wire kafkajs here). */
  start(): Promise<void>;
}

export function createEventConsumer(
  config: KafkaConsumerConfig,
  logger: Logger = createLogger({ component: 'event-consumer' })
): EventConsumer {
  const router = createEventRouter();

  return {
    router,
    async handleMessage(raw) {
      const event = parseEvent(raw);
      const result = await router.route(event);
      if (result.status === 'unrouted') {
        logger.warn('event.unrouted', {
          workflow: event.workflow,
          type: event.type,
        });
      } else {
        logger.info('event.handled', {
          workflow: event.workflow,
          type: event.type,
        });
      }
    },
    async start() {
      // Stub: in production, connect kafkajs and pipe each message through
      // handleMessage:
      //
      //   const kafka = new Kafka({ brokers: config.brokers });
      //   const consumer = kafka.consumer({ groupId: config.groupId });
      //   await consumer.connect();
      //   await consumer.subscribe({ topic: config.topic });
      //   await consumer.run({
      //     eachMessage: ({ message }) =>
      //       this.handleMessage(message.value!.toString()),
      //   });
      logger.info('event-consumer.start (stub)', {
        topic: config.topic,
        brokers: config.brokers.length,
      });
    },
  };
}
