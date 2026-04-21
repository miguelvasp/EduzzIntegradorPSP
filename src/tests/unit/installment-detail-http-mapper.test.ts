import { describe, expect, it } from 'vitest';
import { InstallmentDetailHttpMapper } from '../../modules/transactions/presentation/http/mappers/InstallmentDetailHttpMapper';

describe('InstallmentDetailHttpMapper', () => {
  it('deve mapear detalhe da parcela corretamente', () => {
    const mapper = new InstallmentDetailHttpMapper();

    const result = mapper.map({
      id: 100,
      transactionId: 10,
      installmentNumber: 1,
      amount: 3334,
      fees: 100,
      status: 'paid',
      dueAt: '2024-01-01T00:00:00.000Z',
      paidAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T10:00:00.000Z',
    });

    expect(result).toEqual({
      id: 100,
      transactionId: 10,
      installmentNumber: 1,
      amount: 3334,
      fees: 100,
      status: 'paid',
      dueAt: '2024-01-01T00:00:00.000Z',
      paidAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T10:00:00.000Z',
    });
  });
});
