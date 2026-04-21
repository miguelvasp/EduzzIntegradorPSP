import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../modules/shared/application/errors';
import { GetTransactionByIdUseCase } from '../../modules/transactions/application/use-cases/GetTransactionByIdUseCase';

describe('GetTransactionByIdUseCase', () => {
  it('deve retornar detalhe da transação quando existir', async () => {
    const repository = {
      getById: vi.fn().mockResolvedValue({
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
      }),
    };

    const useCase = new GetTransactionByIdUseCase(repository as never);

    const result = await useCase.execute({
      id: 1,
    });

    expect(repository.getById).toHaveBeenCalledWith({
      id: 1,
    });
    expect(result.id).toBe(1);
    expect(result.payer?.name).toBe('Maria Silva');
    expect(result.installments).toHaveLength(1);
  });

  it('deve falhar com ValidationError para id inválido', async () => {
    const repository = {
      getById: vi.fn(),
    };

    const useCase = new GetTransactionByIdUseCase(repository as never);

    await expect(
      useCase.execute({
        id: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar com NotFoundError quando não existir', async () => {
    const repository = {
      getById: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetTransactionByIdUseCase(repository as never);

    await expect(
      useCase.execute({
        id: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
