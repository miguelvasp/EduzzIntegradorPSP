import type { ExternalTransactionReferenceValueObject, MoneyValueObject } from '../value-objects';
import type { InstallmentEntity } from './installment.entity';
import type { PayerSnapshot } from './payer.entity';

export const CanonicalTransactionStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  DISPUTED: 'disputed',
  PARTIALLY_REFUNDED: 'partially_refunded',
  UNKNOWN: 'unknown',
} as const;

export type CanonicalTransactionStatus =
  (typeof CanonicalTransactionStatus)[keyof typeof CanonicalTransactionStatus];

export const CanonicalPaymentMethod = {
  CREDIT_CARD: 'credit_card',
} as const;

export type CanonicalPaymentMethod = (typeof CanonicalPaymentMethod)[keyof typeof CanonicalPaymentMethod];

export interface TransactionOperationalMetadata {
  canonicalizedAt: Date;
  sourceCapturedAt?: Date;
  lastSynchronizedAt?: Date;
}

export interface TransactionEntity {
  id: number;
  externalReference: ExternalTransactionReferenceValueObject;
  paymentMethod: CanonicalPaymentMethod;
  status: CanonicalTransactionStatus;
  originalAmount: MoneyValueObject;
  netAmount: MoneyValueObject;
  fees: MoneyValueObject;
  installmentCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  payerSnapshot: PayerSnapshot;
  installments: InstallmentEntity[];
  metadata?: TransactionOperationalMetadata;
}
