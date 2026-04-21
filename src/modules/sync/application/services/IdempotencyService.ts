import type { TransactionEntity } from '../../../transactions/domain/entities';
import type { IdempotencyDecision, IdempotencyRepository } from '../ports/IdempotencyRepository';
import { IdempotencyKeyResolver } from './IdempotencyKeyResolver';
import { SafeMergePolicy } from './SafeMergePolicy';

export type IdempotencyServiceResult = {
  decision: IdempotencyDecision;
  key: {
    psp: string;
    externalId: string;
  };
  existingTransaction?: TransactionEntity;
  incomingTransaction: TransactionEntity;
  reason: string;
};

export class IdempotencyService {
  public constructor(
    private readonly keyResolver: IdempotencyKeyResolver,
    private readonly repository: IdempotencyRepository,
    private readonly safeMergePolicy: SafeMergePolicy,
  ) {}

  public async handle(params: {
    transaction: TransactionEntity;
    syncRunId?: string;
  }): Promise<IdempotencyServiceResult> {
    const key = this.keyResolver.resolve(params.transaction);
    const existing = await this.repository.findTransactionByKey(key);

    if (!existing) {
      await this.repository.registerDecision({
        key,
        decision: 'inserted',
        syncRunId: params.syncRunId,
        reason: 'New transaction',
      });

      return {
        decision: 'inserted',
        key,
        incomingTransaction: params.transaction,
        reason: 'New transaction',
      };
    }

    const mergeDecision = this.safeMergePolicy.evaluate(existing.transaction, params.transaction);

    await this.repository.registerDecision({
      key,
      decision: mergeDecision.decision,
      syncRunId: params.syncRunId,
      reason: mergeDecision.reason,
    });

    return {
      decision: mergeDecision.decision,
      key,
      existingTransaction: existing.transaction,
      incomingTransaction: params.transaction,
      reason: mergeDecision.reason,
    };
  }
}
