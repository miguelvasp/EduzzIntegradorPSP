import type { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../../transactions/domain/entities';

export type IdempotencyKeyInput = {
  psp: PspType;
  externalId: string;
};

export type IdempotencyKey = IdempotencyKeyInput;

export type IdempotencyDecision =
  | 'inserted'
  | 'updated'
  | 'processed'
  | 'conflicted'
  | 'ignored_as_duplicate';

export type RegisterIdempotencyDecisionInput = {
  key: IdempotencyKeyInput;
  decision: IdempotencyDecision;
  syncRunId?: string;
  reason?: string;
};

export type ExistingTransactionRecord = {
  transaction: TransactionEntity;
};

export interface IdempotencyRepository {
  findTransactionByKey(key: IdempotencyKeyInput): Promise<ExistingTransactionRecord | null>;
  registerDecision(input: RegisterIdempotencyDecisionInput): Promise<void>;
}
