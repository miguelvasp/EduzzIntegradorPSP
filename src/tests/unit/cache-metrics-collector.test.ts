import { describe, expect, it } from 'vitest';
import { CacheMetricsCollector } from '../../modules/shared/infrastructure/cache/CacheMetricsCollector';

describe('CacheMetricsCollector', () => {
  it('deve registrar hit', () => {
    const collector = new CacheMetricsCollector();

    const event = collector.record({
      operation: 'hit',
      context: {
        resourceType: 'transactions_list',
        cacheKey: 'transactions:list|page=1',
        requestId: 'req-1',
      },
      durationMs: 3,
    });

    expect(event.operation).toBe('hit');
    expect(event.resourceType).toBe('transactions_list');
    expect(collector.getSnapshot().totals.hits).toBe(1);
    expect(collector.getSnapshot().byResource.transactions_list.hits).toBe(1);
  });

  it('deve registrar miss', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'miss',
      context: {
        resourceType: 'transaction_detail',
      },
      durationMs: 5,
    });

    expect(collector.getSnapshot().totals.misses).toBe(1);
    expect(collector.getSnapshot().byResource.transaction_detail.misses).toBe(1);
  });

  it('deve registrar set', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'set',
      context: {
        resourceType: 'transaction_detail',
      },
      durationMs: 7,
    });

    expect(collector.getSnapshot().totals.sets).toBe(1);
    expect(collector.getSnapshot().byResource.transaction_detail.sets).toBe(1);
  });

  it('deve registrar invalidate', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'invalidate',
      context: {
        resourceType: 'transaction_installments',
        namespace: 'transactions:list',
        transactionId: 10,
      },
      durationMs: 4,
    });

    expect(collector.getSnapshot().totals.invalidations).toBe(1);
    expect(collector.getSnapshot().byResource.transaction_installments.invalidations).toBe(1);
  });

  it('deve registrar error', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'error',
      context: {
        resourceType: 'transaction_payer',
      },
      durationMs: 2,
      status: 'failed',
      message: 'Cache read failed',
    });

    expect(collector.getSnapshot().totals.errors).toBe(1);
    expect(collector.getSnapshot().byResource.transaction_payer.errors).toBe(1);
  });

  it('deve registrar bypass', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'bypass',
      context: {
        resourceType: 'installment_detail',
      },
      durationMs: 1,
    });

    expect(collector.getSnapshot().totals.bypasses).toBe(1);
    expect(collector.getSnapshot().byResource.installment_detail.bypasses).toBe(1);
  });

  it('deve devolver snapshot agregado coerente', () => {
    const collector = new CacheMetricsCollector();

    collector.record({
      operation: 'hit',
      context: { resourceType: 'transactions_list' },
      durationMs: 1,
    });

    collector.record({
      operation: 'miss',
      context: { resourceType: 'transactions_list' },
      durationMs: 2,
    });

    collector.record({
      operation: 'set',
      context: { resourceType: 'transactions_list' },
      durationMs: 3,
    });

    const snapshot = collector.getSnapshot();

    expect(snapshot.totals).toEqual({
      hits: 1,
      misses: 1,
      bypasses: 0,
      sets: 1,
      invalidations: 0,
      errors: 0,
    });

    expect(snapshot.byResource.transactions_list).toEqual({
      hits: 1,
      misses: 1,
      bypasses: 0,
      sets: 1,
      invalidations: 0,
      errors: 0,
    });
  });
});
