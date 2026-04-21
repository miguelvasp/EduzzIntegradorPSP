import { describe, expect, it } from 'vitest';
import { TransactionListHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionListHttpMapper';

describe('TransactionListHttpMapper', () => {
  it('deve mapear resposta paginada sem expor dado sensível', () => {
    const mapper = new TransactionListHttpMapper();

    const result = mapper.map({
      items: [
        {
          id: 1,
          externalId: 'or_1',
          psp: 'pagarme',
          status: 'paid',
          originalAmount: 10000,
          netAmount: 9700,
          fees: 300,
          installmentCount: 3,
          currency: 'BRL',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    expect(result).toEqual({
      items: [
        {
          id: 1,
          externalId: 'or_1',
          psp: 'pagarme',
          status: 'paid',
          originalAmount: 10000,
          netAmount: 9700,
          fees: 300,
          installmentCount: 3,
          currency: 'BRL',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T11:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    expect(JSON.stringify(result)).not.toContain('document');
  });
});
