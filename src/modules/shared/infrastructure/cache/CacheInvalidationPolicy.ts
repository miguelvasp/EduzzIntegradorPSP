import type { CacheInvalidationEvent } from './CacheInvalidationEvent';

export type CacheInvalidationDecision = {
  invalidateTransactionDetail: boolean;
  invalidateTransactionsListNamespace: boolean;
  invalidateTransactionInstallments: boolean;
  invalidateInstallmentDetails: boolean;
  invalidateTransactionPayer: boolean;
  affectedInstallmentIds: number[];
};

export class CacheInvalidationPolicy {
  public decide(event: CacheInvalidationEvent): CacheInvalidationDecision {
    if (!event.materialChange || event.changeType === 'no_change') {
      return {
        invalidateTransactionDetail: false,
        invalidateTransactionsListNamespace: false,
        invalidateTransactionInstallments: false,
        invalidateInstallmentDetails: false,
        invalidateTransactionPayer: false,
        affectedInstallmentIds: [],
      };
    }

    if (event.changeType === 'transaction_updated') {
      return {
        invalidateTransactionDetail: true,
        invalidateTransactionsListNamespace: true,
        invalidateTransactionInstallments: false,
        invalidateInstallmentDetails: false,
        invalidateTransactionPayer: false,
        affectedInstallmentIds: [],
      };
    }

    if (event.changeType === 'installments_updated') {
      return {
        invalidateTransactionDetail: true,
        invalidateTransactionsListNamespace: false,
        invalidateTransactionInstallments: true,
        invalidateInstallmentDetails: true,
        invalidateTransactionPayer: false,
        affectedInstallmentIds: event.affectedInstallmentIds ?? [],
      };
    }

    if (event.changeType === 'payer_updated') {
      return {
        invalidateTransactionDetail: true,
        invalidateTransactionsListNamespace: false,
        invalidateTransactionInstallments: false,
        invalidateInstallmentDetails: false,
        invalidateTransactionPayer: true,
        affectedInstallmentIds: [],
      };
    }

    return {
      invalidateTransactionDetail: false,
      invalidateTransactionsListNamespace: false,
      invalidateTransactionInstallments: false,
      invalidateInstallmentDetails: false,
      invalidateTransactionPayer: false,
      affectedInstallmentIds: [],
    };
  }
}
