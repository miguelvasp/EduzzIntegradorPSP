export const TransactionStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  DISPUTED: 'disputed',
  PARTIALLY_REFUNDED: 'partially_refunded',
  UNKNOWN: 'unknown',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];
