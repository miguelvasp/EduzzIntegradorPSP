import type { TransactionEntity } from '../entities';

export const auditableTransactionFields = [
  'externalReference',
  'createdAt',
  'currency',
  'installmentCount',
  'originalAmount',
  'netAmount',
  'fees',
  'payerSnapshot',
] as const;

export const updatableTransactionFields = [
  'status',
  'updatedAt',
  'installments',
  'metadata',
] as const;

export type AuditableTransactionField = (typeof auditableTransactionFields)[number];
export type UpdatableTransactionField = (typeof updatableTransactionFields)[number];

export function isAuditableTransactionField(field: string): field is AuditableTransactionField {
  return auditableTransactionFields.includes(field as AuditableTransactionField);
}

export function isUpdatableTransactionField(field: string): field is UpdatableTransactionField {
  return updatableTransactionFields.includes(field as UpdatableTransactionField);
}

export interface TransactionAuditEnvelope {
  auditable: Pick<TransactionEntity, AuditableTransactionField>;
  updatable: Pick<TransactionEntity, UpdatableTransactionField>;
}

export function createTransactionAuditEnvelope(transaction: TransactionEntity): TransactionAuditEnvelope {
  return {
    auditable: {
      externalReference: transaction.externalReference,
      createdAt: transaction.createdAt,
      currency: transaction.currency,
      installmentCount: transaction.installmentCount,
      originalAmount: transaction.originalAmount,
      netAmount: transaction.netAmount,
      fees: transaction.fees,
      payerSnapshot: transaction.payerSnapshot,
    },
    updatable: {
      status: transaction.status,
      updatedAt: transaction.updatedAt,
      installments: transaction.installments,
      metadata: transaction.metadata,
    },
  };
}
