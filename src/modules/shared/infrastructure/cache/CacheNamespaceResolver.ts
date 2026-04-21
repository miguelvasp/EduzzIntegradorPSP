import type { CacheInvalidationDecision } from './CacheInvalidationPolicy';
import { CacheKeyBuilder } from './CacheKeyBuilder';

export type ResolvedCacheInvalidation = {
  keys: string[];
  namespaces: string[];
};

export class CacheNamespaceResolver {
  public constructor(private readonly cacheKeyBuilder: CacheKeyBuilder) {}

  public resolve(params: {
    transactionId: number;
    decision: CacheInvalidationDecision;
  }): ResolvedCacheInvalidation {
    const keys = new Set<string>();
    const namespaces = new Set<string>();

    if (params.decision.invalidateTransactionDetail) {
      keys.add(this.cacheKeyBuilder.buildTransactionDetailKey(params.transactionId));
    }

    if (params.decision.invalidateTransactionsListNamespace) {
      namespaces.add('transactions:list');
    }

    if (params.decision.invalidateTransactionInstallments) {
      keys.add(this.cacheKeyBuilder.buildTransactionInstallmentsKey(params.transactionId));
    }

    if (params.decision.invalidateTransactionPayer) {
      keys.add(this.cacheKeyBuilder.buildTransactionPayerKey(params.transactionId));
    }

    if (params.decision.invalidateInstallmentDetails) {
      for (const installmentId of params.decision.affectedInstallmentIds) {
        keys.add(
          this.cacheKeyBuilder.buildInstallmentDetailKey(params.transactionId, installmentId),
        );
      }
    }

    return {
      keys: [...keys],
      namespaces: [...namespaces],
    };
  }
}
