import type { OutboxRepository } from '../ports/OutboxRepository';

export class DeadLetterService {
  public constructor(private readonly outboxRepository: OutboxRepository) {}

  public async deadLetter(params: {
    messageId: string;
    reason: string;
    retryCount: number;
  }): Promise<void> {
    await this.outboxRepository.markDeadLettered(
      params.messageId,
      params.reason,
      params.retryCount,
    );
  }
}
