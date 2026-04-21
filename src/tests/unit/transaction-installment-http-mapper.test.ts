import { describe, expect, it } from 'vitest';
import { TransactionInstallmentHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionInstallmentHttpMapper';

describe('TransactionInstallmentHttpMapper', () => {
  it('deve mapear parcelas corretamente preservando a ordenação recebida', () => {
    const mapper = new TransactionInstallmentHttpMapper();

    const result = mapper.map([
      {
        id: 1,
        transactionId: 10,
        installmentNumber: 1,
        amount: 3334,
        fees: 100,
        status: 'paid',
        dueAt: '2024-01-01T00:00:00.000Z',
        paidAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      },
      {
        id: 2,
        transactionId: 10,
        installmentNumber: 2,
        amount: 3333,
        fees: 100,
        status: 'paid',
        dueAt: '2024-02-01T00:00:00.000Z',
        paidAt: '2024-02-05T00:00:00.000Z',
        updatedAt: '2024-02-05T10:00:00.000Z',
      },
    ]);

    expect(result).toEqual([
      {
        id: 1,
        transactionId: 10,
        installmentNumber: 1,
        amount: 3334,
        fees: 100,
        status: 'paid',
        dueAt: '2024-01-01T00:00:00.000Z',
        paidAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      },
      {
        id: 2,
        transactionId: 10,
        installmentNumber: 2,
        amount: 3333,
        fees: 100,
        status: 'paid',
        dueAt: '2024-02-01T00:00:00.000Z',
        paidAt: '2024-02-05T00:00:00.000Z',
        updatedAt: '2024-02-05T10:00:00.000Z',
      },
    ]);
  });
});
