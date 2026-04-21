import { appLogger } from '../../../../app/server/logging';
import type { CacheInvalidationEvent } from './CacheInvalidationEvent';
import { CacheInvalidationPolicy } from './CacheInvalidationPolicy';
import { CacheNamespaceResolver } from './CacheNamespaceResolver';
import type { CacheService } from './CacheService';

export class CacheInvalidationService {
  public constructor(
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationPolicy: CacheInvalidationPolicy,
    private readonly cacheNamespaceResolver: CacheNamespaceResolver,
  ) {}

  public async invalidate(event: CacheInvalidationEvent): Promise<void> {
    const decision = this.cacheInvalidationPolicy.decide(event);

    if (
      !decision.invalidateTransactionDetail &&
      !decision.invalidateTransactionsListNamespace &&
      !decision.invalidateTransactionInstallments &&
      !decision.invalidateInstallmentDetails &&
      !decision.invalidateTransactionPayer
    ) {
      appLogger.info({
        eventType: 'cache_invalidation_skipped',
        message: 'Cache invalidation skipped',
        status: 'completed',
        context: {
          transactionId: event.transactionId,
          syncRunId: event.syncRunId,
          changeType: event.changeType,
        },
      });

      return;
    }

    const resolved = this.cacheNamespaceResolver.resolve({
      transactionId: event.transactionId,
      decision,
    });

    for (const key of resolved.keys) {
      try {
        await this.cacheService.delete(key);

        appLogger.info({
          eventType: 'cache_key_invalidated',
          message: 'Cache key invalidated',
          status: 'completed',
          context: {
            transactionId: event.transactionId,
            syncRunId: event.syncRunId,
            changeType: event.changeType,
            key,
          },
        });
      } catch (error) {
        appLogger.error({
          eventType: 'cache_invalidation_error',
          message: 'Cache key invalidation failed',
          status: 'failed',
          context: {
            transactionId: event.transactionId,
            syncRunId: event.syncRunId,
            changeType: event.changeType,
            key,
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                  }
                : error,
          },
        });
      }
    }

    for (const namespace of resolved.namespaces) {
      appLogger.info({
        eventType: 'cache_namespace_invalidation_requested',
        message: 'Cache namespace invalidation requested',
        status: 'completed',
        context: {
          transactionId: event.transactionId,
          syncRunId: event.syncRunId,
          changeType: event.changeType,
          namespace,
        },
      });
    }
  }
}
