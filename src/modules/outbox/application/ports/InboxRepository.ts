import type { InboxMessage } from '../../domain/InboxMessage';

export interface InboxRepository {
  findByMessageIdAndConsumer(messageId: string, consumerName: string): Promise<InboxMessage | null>;

  add(message: InboxMessage): Promise<void>;

  markProcessing(id: string): Promise<void>;

  markProcessed(id: string, processedAt: string): Promise<void>;

  markFailed(id: string, reason: string): Promise<void>;

  markIgnoredDuplicate(id: string): Promise<void>;
}
