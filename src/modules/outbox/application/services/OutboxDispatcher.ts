import { appLogger } from '../../../../app/server/logging';
import type { OutboxRepository } from '../ports/OutboxRepository';
import { OutboxMessageProcessor } from './OutboxMessageProcessor';

export class OutboxDispatcher {
  public constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly outboxMessageProcessor: OutboxMessageProcessor,
  ) {}

  public async dispatch(batchSize: number): Promise<void> {
    const now = new Date().toISOString();
    const messages = await this.outboxRepository.findDispatchable(batchSize, now);

    for (const message of messages) {
      try {
        const locked = await this.outboxRepository.markProcessing(message.id);

        if (!locked) {
          continue;
        }

        const result = await this.outboxMessageProcessor.process(message);

        appLogger.info({
          eventType: 'outbox_dispatch_result',
          message: 'Outbox message processed',
          status: 'completed',
          context: {
            messageId: result.messageId,
            eventType: result.eventType,
            aggregateType: result.aggregateType,
            aggregateId: result.aggregateId,
            result: result.result,
            retryCount: result.retryCount,
            nextAttemptAt: result.nextAttemptAt,
            reason: result.reason,
          },
        });
      } catch (error) {
        appLogger.error({
          eventType: 'outbox_dispatch_error',
          message: 'Outbox dispatcher isolated message failure',
          status: 'failed',
          context: {
            messageId: message.id,
            eventType: message.eventType,
            aggregateType: message.aggregateType,
            aggregateId: message.aggregateId,
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                  }
                : error,
          },
        });
      }
    }
  }
}
