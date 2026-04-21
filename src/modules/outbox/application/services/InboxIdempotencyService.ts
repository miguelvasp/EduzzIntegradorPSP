import { randomUUID } from 'node:crypto';
import { appLogger } from '../../../../app/server/logging';
import type { InboxMessage } from '../../domain/InboxMessage';
import type { InboxConsumerContext } from '../dto/InboxConsumerContext';
import type { InboxProcessingResult } from '../dto/InboxProcessingResult';
import type { InboxRepository } from '../ports/InboxRepository';

type ConsumerHandler = () => Promise<void>;

export class InboxIdempotencyService {
  public constructor(private readonly inboxRepository: InboxRepository) {}

  public async consume(
    context: InboxConsumerContext,
    handler: ConsumerHandler,
  ): Promise<InboxProcessingResult> {
    const existing = await this.inboxRepository.findByMessageIdAndConsumer(
      context.messageId,
      context.consumerName,
    );

    if (existing?.status === 'processed') {
      await this.inboxRepository.markIgnoredDuplicate(existing.id);

      appLogger.info({
        eventType: 'inbox_duplicate_ignored',
        message: 'Inbox duplicate ignored',
        status: 'completed',
        context: {
          messageId: context.messageId,
          eventType: context.eventType,
          consumerName: context.consumerName,
          aggregateType: context.aggregateType,
          aggregateId: context.aggregateId,
          correlationId: context.correlationId,
        },
      });

      return {
        result: 'ignored_duplicate',
        messageId: context.messageId,
        consumerName: context.consumerName,
        reason: 'Message already processed for this consumer',
      };
    }

    let inboxMessage = existing;

    if (!inboxMessage) {
      inboxMessage = this.createInboxMessage(context);
      await this.inboxRepository.add(inboxMessage);
    }

    await this.inboxRepository.markProcessing(inboxMessage.id);

    appLogger.info({
      eventType: 'inbox_processing_started',
      message: 'Inbox processing started',
      status: 'completed',
      context: {
        messageId: context.messageId,
        eventType: context.eventType,
        consumerName: context.consumerName,
        aggregateType: context.aggregateType,
        aggregateId: context.aggregateId,
        correlationId: context.correlationId,
      },
    });

    try {
      await handler();
      await this.inboxRepository.markProcessed(inboxMessage.id, new Date().toISOString());

      return {
        result: 'processed_successfully',
        messageId: context.messageId,
        consumerName: context.consumerName,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Inbox processing failed';

      await this.inboxRepository.markFailed(inboxMessage.id, reason);

      appLogger.error({
        eventType: 'inbox_processing_failed',
        message: 'Inbox processing failed',
        status: 'failed',
        context: {
          messageId: context.messageId,
          eventType: context.eventType,
          consumerName: context.consumerName,
          aggregateType: context.aggregateType,
          aggregateId: context.aggregateId,
          correlationId: context.correlationId,
          reason,
        },
      });

      return {
        result: 'failed',
        messageId: context.messageId,
        consumerName: context.consumerName,
        reason,
      };
    }
  }

  private createInboxMessage(context: InboxConsumerContext): InboxMessage {
    return {
      id: randomUUID(),
      messageId: context.messageId,
      eventType: context.eventType,
      consumerName: context.consumerName,
      aggregateType: context.aggregateType,
      aggregateId: context.aggregateId,
      status: 'received',
      receivedAt: new Date().toISOString(),
      correlationId: context.correlationId,
    };
  }
}
