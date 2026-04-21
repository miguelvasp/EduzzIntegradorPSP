export type CacheMetricsOperation = 'hit' | 'miss' | 'bypass' | 'set' | 'invalidate' | 'error';

export type CacheMetricsResourceType =
  | 'transactions_list'
  | 'transaction_detail'
  | 'transaction_installments'
  | 'installment_detail'
  | 'transaction_payer'
  | 'unknown';

export type CacheMetricsEvent = {
  operation: CacheMetricsOperation;
  resourceType: CacheMetricsResourceType;
  status: 'success' | 'failed';
  durationMs: number;
  cacheKey?: string;
  namespace?: string;
  requestId?: string;
  correlationId?: string;
  transactionId?: number;
  syncRunId?: string;
  message?: string;
};
