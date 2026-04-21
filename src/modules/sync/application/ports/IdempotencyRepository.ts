import { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../../transactions/domain/entities';

export type IdempotencyKey = {
  psp: PspType;
  externalId: string;
};

export type IdempotencyDecision = 'inserted' | 'updated' | 'ignored_as_duplicate' | 'conflicted';

export type ExistingTransactionRecord = {
  transaction: TransactionEntity;
};

export type RegisterIdempotencyDecisionInput = {
  key: IdempotencyKey;
  decision: IdempotencyDecision;
  syncRunId?: string;
  reason?: string;
};

export interface IdempotencyRepository {
  findTransactionByKey(key: IdempotencyKey): Promise<ExistingTransactionRecord | null>;

  registerDecision(input: RegisterIdempotencyDecisionInput): Promise<void>;
}
