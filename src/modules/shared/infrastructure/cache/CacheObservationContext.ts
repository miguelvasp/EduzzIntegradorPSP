import type { CacheMetricsResourceType } from './CacheMetricsEvent';

export type CacheObservationContext = {
  resourceType: CacheMetricsResourceType;
  requestId?: string;
  correlationId?: string;
  transactionId?: number;
  syncRunId?: string;
  cacheKey?: string;
  namespace?: string;
};
