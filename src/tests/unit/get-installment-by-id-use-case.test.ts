import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../modules/shared/application/errors';
import { GetInstallmentByIdUseCase } from '../../modules/transactions/application/use-cases/GetInstallmentByIdUseCase';

describe('GetInstallmentByIdUseCase', () => {
  it('deve retornar detalhe da parcela quando existir e pertencer à transação', async () => {
    const repository = {
      listByTransactionId: vi.fn(),
      getById: vi.fn().mockResolvedValue({
        id: 100,
        transactionId: 10,
        installmentNumber: 1,
        amount: 3334,
        fees: 100,
        status: 'paid',
        dueAt: '2024-01-01T00:00:00.000Z',
        paidAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z',
      }),
    };

    const useCase = new GetInstallmentByIdUseCase(repository);

    const result = await useCase.execute({
      transactionId: 10,
      installmentId: 100,
    });

    expect(repository.getById).toHaveBeenCalledWith({
      transactionId: 10,
      installmentId: 100,
    });
    expect(result.id).toBe(100);
    expect(result.transactionId).toBe(10);
  });

  it('deve falhar com ValidationError para transactionId inválido', async () => {
    const repository = {
      listByTransactionId: vi.fn(),
      getById: vi.fn(),
    };

    const useCase = new GetInstallmentByIdUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 0,
        installmentId: 100,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar com ValidationError para installmentId inválido', async () => {
    const repository = {
      listByTransactionId: vi.fn(),
      getById: vi.fn(),
    };

    const useCase = new GetInstallmentByIdUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 10,
        installmentId: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar com NotFoundError quando parcela não existir ou não pertencer à transação', async () => {
    const repository = {
      listByTransactionId: vi.fn(),
      getById: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetInstallmentByIdUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 10,
        installmentId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
