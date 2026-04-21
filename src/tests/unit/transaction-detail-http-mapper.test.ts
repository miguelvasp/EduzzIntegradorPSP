import { describe, expect, it } from 'vitest';
import { TransactionDetailHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionDetailHttpMapper';

describe('TransactionDetailHttpMapper', () => {
  it('deve mapear detalhe corretamente sem expor documento puro ou hash', () => {
    const mapper = new TransactionDetailHttpMapper();

    const result = mapper.map({
      id: 1,
      externalId: 'or_123',
      psp: 'pagarme',
      status: 'paid',
      originalAmount: 10000,
      netAmount: 9700,
      fees: 300,
      installmentCount: 3,
      currency: 'BRL',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T11:00:00.000Z',
      payer: {
        id: 10,
        externalId: 'cus_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentType: 'cpf',
        hasDocument: true,
      },
      installments: [
        {
          id: 100,
          installmentNumber: 1,
          amount: 3334,
          fees: 100,
          status: 'paid',
          paidAt: '2024-01-05T10:00:00.000Z',
          updatedAt: '2024-01-05T11:00:00.000Z',
        },
      ],
    });

    expect(result).toEqual({
      id: 1,
      externalId: 'or_123',
      psp: 'pagarme',
      status: 'paid',
      originalAmount: 10000,
      netAmount: 9700,
      fees: 300,
      installmentCount: 3,
      currency: 'BRL',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T11:00:00.000Z',
      payer: {
        id: 10,
        externalId: 'cus_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentType: 'cpf',
        hasDocument: true,
      },
      installments: [
        {
          id: 100,
          installmentNumber: 1,
          amount: 3334,
          fees: 100,
          status: 'paid',
          paidAt: '2024-01-05T10:00:00.000Z',
          updatedAt: '2024-01-05T11:00:00.000Z',
        },
      ],
    });

    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('documentHash');
    expect(serialized).not.toContain('12345678901');
  });
});
