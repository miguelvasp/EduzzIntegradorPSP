import type { OutboxMessage } from '../../domain/OutboxMessage';

export interface OutboxRepository {
  add(message: OutboxMessage): Promise<void>;

  findDispatchable(batchSize: number, now: string): Promise<OutboxMessage[]>;

  markProcessing(messageId: string): Promise<boolean>;

  markProcessed(messageId: string, processedAt: string): Promise<void>;

  scheduleRetry(
    messageId: string,
    nextAttemptAt: string,
    retryCount: number,
    lastError: string,
  ): Promise<void>;

  markDeadLettered(messageId: string, reason: string, retryCount: number): Promise<void>;

  markFailedTerminal(messageId: string, reason: string, retryCount: number): Promise<void>;
}
