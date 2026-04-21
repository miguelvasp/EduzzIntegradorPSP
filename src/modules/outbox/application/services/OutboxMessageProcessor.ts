import type { OutboxMessage } from '../../domain/OutboxMessage';
import type { OutboxDispatchResult } from '../dto/OutboxDispatchResult';
import type { OutboxRepository } from '../ports/OutboxRepository';
import { DeadLetterService } from './DeadLetterService';
import { OutboxRetryPolicy } from './OutboxRetryPolicy';

type MessageHandler = (message: OutboxMessage) => Promise<void>;

export class OutboxMessageProcessor {
  public constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly outboxRetryPolicy: OutboxRetryPolicy,
    private readonly deadLetterService: DeadLetterService,
    private readonly messageHandler: MessageHandler,
  ) {}

  public async process(message: OutboxMessage): Promise<OutboxDispatchResult> {
    try {
      await this.messageHandler(message);
      await this.outboxRepository.markProcessed(message.id, new Date().toISOString());

      return {
        messageId: message.id,
        eventType: message.eventType,
        aggregateType: message.aggregateType,
        aggregateId: message.aggregateId,
        result: 'processed_successfully',
        retryCount: message.retryCount,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown processing error';

      if (this.outboxRetryPolicy.shouldRetry(message.retryCount, error)) {
        const nextRetryCount = message.retryCount + 1;
        const nextAttemptAt = this.outboxRetryPolicy.getNextAttemptAt(
          message.retryCount,
          new Date(),
        );

        await this.outboxRepository.scheduleRetry(
          message.id,
          nextAttemptAt,
          nextRetryCount,
          reason,
        );

        return {
          messageId: message.id,
          eventType: message.eventType,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          result: 'retry_scheduled',
          retryCount: nextRetryCount,
          nextAttemptAt,
          reason,
        };
      }

      if (this.outboxRetryPolicy.isRetriable(error)) {
        await this.deadLetterService.deadLetter({
          messageId: message.id,
          reason,
          retryCount: message.retryCount,
        });

        return {
          messageId: message.id,
          eventType: message.eventType,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          result: 'dead_lettered',
          retryCount: message.retryCount,
          reason,
        };
      }

      await this.outboxRepository.markFailedTerminal(message.id, reason, message.retryCount);

      return {
        messageId: message.id,
        eventType: message.eventType,
        aggregateType: message.aggregateType,
        aggregateId: message.aggregateId,
        result: 'failed_terminal',
        retryCount: message.retryCount,
        reason,
      };
    }
  }
}
