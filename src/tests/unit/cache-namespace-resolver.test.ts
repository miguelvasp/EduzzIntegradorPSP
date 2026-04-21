import { describe, expect, it } from 'vitest';
import { CacheKeyBuilder } from '../../modules/shared/infrastructure/cache/CacheKeyBuilder';
import { CacheNamespaceResolver } from '../../modules/shared/infrastructure/cache/CacheNamespaceResolver';

describe('CacheNamespaceResolver', () => {
  it('deve resolver chave do detalhe da transação e namespace da listagem', () => {
    const resolver = new CacheNamespaceResolver(new CacheKeyBuilder());

    const result = resolver.resolve({
      transactionId: 10,
      decision: {
        invalidateTransactionDetail: true,
        invalidateTransactionsListNamespace: true,
        invalidateTransactionInstallments: false,
        invalidateInstallmentDetails: false,
        invalidateTransactionPayer: false,
        affectedInstallmentIds: [],
      },
    });

    expect(result).toEqual({
      keys: ['transactions:detail|transactionId=10'],
      namespaces: ['transactions:list'],
    });
  });

  it('deve resolver listagem de parcelas e detalhes das parcelas', () => {
    const resolver = new CacheNamespaceResolver(new CacheKeyBuilder());

    const result = resolver.resolve({
      transactionId: 10,
      decision: {
        invalidateTransactionDetail: false,
        invalidateTransactionsListNamespace: false,
        invalidateTransactionInstallments: true,
        invalidateInstallmentDetails: true,
        invalidateTransactionPayer: false,
        affectedInstallmentIds: [100, 101],
      },
    });

    expect(result).toEqual({
      keys: [
        'transactions:installments|transactionId=10',
        'transactions:installment-detail|installmentId=100|transactionId=10',
        'transactions:installment-detail|installmentId=101|transactionId=10',
      ],
      namespaces: [],
    });
  });

  it('deve resolver chave do pagador', () => {
    const resolver = new CacheNamespaceResolver(new CacheKeyBuilder());

    const result = resolver.resolve({
      transactionId: 10,
      decision: {
        invalidateTransactionDetail: false,
        invalidateTransactionsListNamespace: false,
        invalidateTransactionInstallments: false,
        invalidateInstallmentDetails: false,
        invalidateTransactionPayer: true,
        affectedInstallmentIds: [],
      },
    });

    expect(result).toEqual({
      keys: ['transactions:payer|transactionId=10'],
      namespaces: [],
    });
  });
});
