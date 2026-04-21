import { describe, expect, it } from 'vitest';
import { CacheKeyBuilder } from '../../modules/shared/infrastructure/cache/CacheKeyBuilder';

describe('CacheKeyBuilder', () => {
  it('deve montar chave determinística para listagem paginada de transações', () => {
    const builder = new CacheKeyBuilder();

    const result = builder.buildTransactionsListKey({
      page: 1,
      limit: 20,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'paid',
      psp: 'pagarme',
      payerDocument: 'hash-123',
    });

    expect(result).toBe(
      'transactions:list|endDate=2024-01-31|limit=20|page=1|payerDocument=hash-123|psp=pagarme|startDate=2024-01-01|status=paid',
    );
  });

  it('deve montar chave estável para filtros vazios', () => {
    const builder = new CacheKeyBuilder();

    const result = builder.buildTransactionsListKey({
      page: 1,
      limit: 20,
    });

    expect(result).toBe(
      'transactions:list|endDate=|limit=20|page=1|payerDocument=|psp=|startDate=|status=',
    );
  });

  it('deve montar chave do detalhe da transação', () => {
    const builder = new CacheKeyBuilder();

    expect(builder.buildTransactionDetailKey(10)).toBe('transactions:detail|transactionId=10');
  });

  it('deve montar chave da listagem de parcelas', () => {
    const builder = new CacheKeyBuilder();

    expect(builder.buildTransactionInstallmentsKey(10)).toBe(
      'transactions:installments|transactionId=10',
    );
  });

  it('deve montar chave do detalhe da parcela', () => {
    const builder = new CacheKeyBuilder();

    expect(builder.buildInstallmentDetailKey(10, 100)).toBe(
      'transactions:installment-detail|installmentId=100|transactionId=10',
    );
  });

  it('deve montar chave do pagador da transação', () => {
    const builder = new CacheKeyBuilder();

    expect(builder.buildTransactionPayerKey(10)).toBe('transactions:payer|transactionId=10');
  });
});
