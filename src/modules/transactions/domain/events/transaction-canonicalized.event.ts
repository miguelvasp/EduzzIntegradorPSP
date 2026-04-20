import type { CanonicalTransactionStatus } from '../entities';
import type { ExternalTransactionReferenceValueObject } from '../value-objects';
import type { TransactionValidityIssueCode } from '../policies';

export const TransactionDomainEventType = {
  TRANSACTION_CANONICALIZED: 'transaction.canonicalized',
} as const;

export type TransactionDomainEventType =
  (typeof TransactionDomainEventType)[keyof typeof TransactionDomainEventType];

export interface TransactionCanonicalizedEvent {
  eventId: string;
  type: typeof TransactionDomainEventType.TRANSACTION_CANONICALIZED;
  occurredAt: Date;
  transactionId: number;
  externalReference: ExternalTransactionReferenceValueObject;
  canonicalStatus: CanonicalTransactionStatus;
  accepted: boolean;
  issueCodes: TransactionValidityIssueCode[];
}
