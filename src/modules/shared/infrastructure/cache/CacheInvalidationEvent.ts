export type CacheInvalidationChangeType =
  | 'transaction_updated'
  | 'installments_updated'
  | 'payer_updated'
  | 'no_change';

export type CacheInvalidationEvent = {
  transactionId: number;
  syncRunId?: string;
  changeType: CacheInvalidationChangeType;
  affectedInstallmentIds?: number[];
  payerChanged?: boolean;
  materialChange: boolean;
};
