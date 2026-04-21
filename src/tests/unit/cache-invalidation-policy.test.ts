import { describe, expect, it } from 'vitest';
import { CacheInvalidationPolicy } from '../../modules/shared/infrastructure/cache/CacheInvalidationPolicy';

describe('CacheInvalidationPolicy', () => {
  it('deve invalidar detalhe e namespace de listagem para update de transação', () => {
    const policy = new CacheInvalidationPolicy();

    const result = policy.decide({
      transactionId: 1,
      changeType: 'transaction_updated',
      materialChange: true,
    });

    expect(result).toEqual({
      invalidateTransactionDetail: true,
      invalidateTransactionsListNamespace: true,
      invalidateTransactionInstallments: false,
      invalidateInstallmentDetails: false,
      invalidateTransactionPayer: false,
      affectedInstallmentIds: [],
    });
  });

  it('deve invalidar parcelas para update de parcelas', () => {
    const policy = new CacheInvalidationPolicy();

    const result = policy.decide({
      transactionId: 1,
      changeType: 'installments_updated',
      affectedInstallmentIds: [10, 11],
      materialChange: true,
    });

    expect(result).toEqual({
      invalidateTransactionDetail: true,
      invalidateTransactionsListNamespace: false,
      invalidateTransactionInstallments: true,
      invalidateInstallmentDetails: true,
      invalidateTransactionPayer: false,
      affectedInstallmentIds: [10, 11],
    });
  });

  it('deve invalidar pagador e detalhe para update de pagador', () => {
    const policy = new CacheInvalidationPolicy();

    const result = policy.decide({
      transactionId: 1,
      changeType: 'payer_updated',
      payerChanged: true,
      materialChange: true,
    });

    expect(result).toEqual({
      invalidateTransactionDetail: true,
      invalidateTransactionsListNamespace: false,
      invalidateTransactionInstallments: false,
      invalidateInstallmentDetails: false,
      invalidateTransactionPayer: true,
      affectedInstallmentIds: [],
    });
  });

  it('nao deve invalidar nada em no_change', () => {
    const policy = new CacheInvalidationPolicy();

    const result = policy.decide({
      transactionId: 1,
      changeType: 'no_change',
      materialChange: false,
    });

    expect(result).toEqual({
      invalidateTransactionDetail: false,
      invalidateTransactionsListNamespace: false,
      invalidateTransactionInstallments: false,
      invalidateInstallmentDetails: false,
      invalidateTransactionPayer: false,
      affectedInstallmentIds: [],
    });
  });
});
