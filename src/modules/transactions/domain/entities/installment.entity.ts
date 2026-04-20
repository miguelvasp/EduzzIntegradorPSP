import type { MoneyValueObject } from '../value-objects';

export const CanonicalInstallmentStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PAID: 'paid',
  CANCELED: 'canceled',
  FAILED: 'failed',
  UNKNOWN: 'unknown',
} as const;

export type CanonicalInstallmentStatus =
  (typeof CanonicalInstallmentStatus)[keyof typeof CanonicalInstallmentStatus];

export interface InstallmentEntity {
  id: number;
  transactionId: number;
  installmentNumber: number;
  amount: MoneyValueObject;
  fees: MoneyValueObject;
  status: CanonicalInstallmentStatus;
  dueDate?: Date;
  paidAt?: Date;
}
