import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../modules/shared/application/errors';
import { ListTransactionInstallmentsUseCase } from '../../modules/transactions/application/use-cases/ListTransactionInstallmentsUseCase';

describe('ListTransactionInstallmentsUseCase', () => {
  it('deve retornar parcelas ordenadas por installmentNumber', async () => {
    const repository = {
      listByTransactionId: vi.fn().mockResolvedValue([
        {
          id: 2,
          transactionId: 1,
          installmentNumber: 2,
          amount: 3333,
          fees: 100,
          status: 'paid',
          dueAt: '2024-02-01T00:00:00.000Z',
          paidAt: '2024-02-05T00:00:00.000Z',
          updatedAt: '2024-02-05T10:00:00.000Z',
        },
        {
          id: 1,
          transactionId: 1,
          installmentNumber: 1,
          amount: 3334,
          fees: 100,
          status: 'paid',
          dueAt: '2024-01-01T00:00:00.000Z',
          paidAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-05T10:00:00.000Z',
        },
      ]),
      getById: vi.fn(),
    };

    const useCase = new ListTransactionInstallmentsUseCase(repository);

    const result = await useCase.execute({
      transactionId: 1,
    });

    expect(repository.listByTransactionId).toHaveBeenCalledWith({
      transactionId: 1,
    });
    expect(result.map((item) => item.installmentNumber)).toEqual([1, 2]);
  });

  it('deve falhar com ValidationError para id inválido', async () => {
    const repository = {
      listByTransactionId: vi.fn(),
      getById: vi.fn(),
    };

    const useCase = new ListTransactionInstallmentsUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar com NotFoundError quando a transação não existir', async () => {
    const repository = {
      listByTransactionId: vi.fn().mockResolvedValue(null),
      getById: vi.fn(),
    };

    const useCase = new ListTransactionInstallmentsUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deve retornar lista vazia quando a transação existir sem parcelas', async () => {
    const repository = {
      listByTransactionId: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
    };

    const useCase = new ListTransactionInstallmentsUseCase(repository);

    const result = await useCase.execute({
      transactionId: 1,
    });

    expect(result).toEqual([]);
  });
});
