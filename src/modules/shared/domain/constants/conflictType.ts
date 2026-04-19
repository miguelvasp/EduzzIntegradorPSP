export const ConflictType = {
  AMOUNT_DIVERGENCE: 'amount_divergence',
  OUT_OF_ORDER_EVENT: 'out_of_order_event',
  STATUS_REGRESSION: 'status_regression',
  INCOMPLETE_DATA: 'incomplete_data',
  TRANSACTION_INSTALLMENT_INCONSISTENCY: 'transaction_installment_inconsistency',
} as const;

export type ConflictType = (typeof ConflictType)[keyof typeof ConflictType];
