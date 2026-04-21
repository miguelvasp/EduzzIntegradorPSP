import { appLogger } from '../../../../app/server/logging';
import type { OutboxMessage } from '../../domain/OutboxMessage';
import type { OutboxRepository } from '../ports/OutboxRepository';
import type { UnitOfWork } from '../ports/UnitOfWork';

export class TransactionalOutboxService {
  public constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute<T>(params: {
    persistState: () => Promise<T>;
    outboxMessage: OutboxMessage;
  }): Promise<T> {
    return this.unitOfWork.execute(async () => {
      const result = await params.persistState();
      await this.outboxRepository.add(params.outboxMessage);

      appLogger.info({
        eventType: 'outbox_message_persisted',
        message: 'Outbox message persisted in transactional boundary',
        status: 'completed',
        context: {
          eventType: params.outboxMessage.eventType,
          aggregateType: params.outboxMessage.aggregateType,
          aggregateId: params.outboxMessage.aggregateId,
          correlationId: params.outboxMessage.correlationId,
          syncRunId: params.outboxMessage.syncRunId,
          outboxMessageId: params.outboxMessage.id,
        },
      });

      return result;
    });
  }
}
