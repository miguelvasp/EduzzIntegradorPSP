import { appLogger } from '../../../../app/server/logging';
import type {
  CacheMetricsEvent,
  CacheMetricsOperation,
  CacheMetricsResourceType,
} from './CacheMetricsEvent';
import type { CacheObservationContext } from './CacheObservationContext';

type CacheMetricsSnapshot = {
  totals: {
    hits: number;
    misses: number;
    bypasses: number;
    sets: number;
    invalidations: number;
    errors: number;
  };
  byResource: Record<
    CacheMetricsResourceType,
    {
      hits: number;
      misses: number;
      bypasses: number;
      sets: number;
      invalidations: number;
      errors: number;
    }
  >;
};

type Counters = {
  hits: number;
  misses: number;
  bypasses: number;
  sets: number;
  invalidations: number;
  errors: number;
};

export class CacheMetricsCollector {
  private readonly totals: Counters = {
    hits: 0,
    misses: 0,
    bypasses: 0,
    sets: 0,
    invalidations: 0,
    errors: 0,
  };

  private readonly byResource = new Map<CacheMetricsResourceType, Counters>();

  public record(params: {
    operation: CacheMetricsOperation;
    context: CacheObservationContext;
    durationMs: number;
    status?: 'success' | 'failed';
    message?: string;
  }): CacheMetricsEvent {
    const event: CacheMetricsEvent = {
      operation: params.operation,
      resourceType: params.context.resourceType,
      status: params.status ?? (params.operation === 'error' ? 'failed' : 'success'),
      durationMs: params.durationMs,
      cacheKey: params.context.cacheKey,
      namespace: params.context.namespace,
      requestId: params.context.requestId,
      correlationId: params.context.correlationId,
      transactionId: params.context.transactionId,
      syncRunId: params.context.syncRunId,
      message: params.message,
    };

    this.increment(event.operation, event.resourceType);

    const logPayload = {
      eventType: `cache_${event.operation}`,
      message: params.message ?? this.defaultMessage(event.operation),
      status: event.status === 'success' ? 'completed' : 'failed',
      durationMs: event.durationMs,
      context: {
        resourceType: event.resourceType,
        cacheKey: event.cacheKey,
        namespace: event.namespace,
        requestId: event.requestId,
        correlationId: event.correlationId,
        transactionId: event.transactionId,
        syncRunId: event.syncRunId,
      },
    };

    if (event.status === 'failed') {
      appLogger.error(logPayload);
    } else {
      appLogger.info(logPayload);
    }

    return event;
  }

  public getSnapshot(): CacheMetricsSnapshot {
    return {
      totals: { ...this.totals },
      byResource: this.buildByResourceSnapshot(),
    };
  }

  private increment(
    operation: CacheMetricsOperation,
    resourceType: CacheMetricsResourceType,
  ): void {
    const resourceCounters = this.getOrCreateResourceCounters(resourceType);

    switch (operation) {
      case 'hit':
        this.totals.hits += 1;
        resourceCounters.hits += 1;
        break;
      case 'miss':
        this.totals.misses += 1;
        resourceCounters.misses += 1;
        break;
      case 'bypass':
        this.totals.bypasses += 1;
        resourceCounters.bypasses += 1;
        break;
      case 'set':
        this.totals.sets += 1;
        resourceCounters.sets += 1;
        break;
      case 'invalidate':
        this.totals.invalidations += 1;
        resourceCounters.invalidations += 1;
        break;
      case 'error':
        this.totals.errors += 1;
        resourceCounters.errors += 1;
        break;
    }
  }

  private getOrCreateResourceCounters(resourceType: CacheMetricsResourceType): Counters {
    const existing = this.byResource.get(resourceType);

    if (existing) {
      return existing;
    }

    const created: Counters = {
      hits: 0,
      misses: 0,
      bypasses: 0,
      sets: 0,
      invalidations: 0,
      errors: 0,
    };

    this.byResource.set(resourceType, created);
    return created;
  }

  private buildByResourceSnapshot(): Record<CacheMetricsResourceType, Counters> {
    const base: Record<CacheMetricsResourceType, Counters> = {
      transactions_list: this.emptyCounters(),
      transaction_detail: this.emptyCounters(),
      transaction_installments: this.emptyCounters(),
      installment_detail: this.emptyCounters(),
      transaction_payer: this.emptyCounters(),
      unknown: this.emptyCounters(),
    };

    for (const [resourceType, counters] of this.byResource.entries()) {
      base[resourceType] = { ...counters };
    }

    return base;
  }

  private emptyCounters(): Counters {
    return {
      hits: 0,
      misses: 0,
      bypasses: 0,
      sets: 0,
      invalidations: 0,
      errors: 0,
    };
  }

  private defaultMessage(operation: CacheMetricsOperation): string {
    switch (operation) {
      case 'hit':
        return 'Cache hit';
      case 'miss':
        return 'Cache miss';
      case 'bypass':
        return 'Cache bypass';
      case 'set':
        return 'Cache set';
      case 'invalidate':
        return 'Cache invalidated';
      case 'error':
        return 'Cache operation failed';
    }
  }
}
