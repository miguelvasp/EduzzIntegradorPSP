import { describe, expect, it, vi } from 'vitest';
import { NotFoundError, ValidationError } from '../../modules/shared/application/errors';
import { GetTransactionPayerUseCase } from '../../modules/transactions/application/use-cases/GetTransactionPayerUseCase';

describe('GetTransactionPayerUseCase', () => {
  it('deve retornar pagador da transação quando existir', async () => {
    const repository = {
      list: vi.fn(),
      getById: vi.fn(),
      getPayerByTransactionId: vi.fn().mockResolvedValue({
        id: 10,
        externalId: 'cus_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentType: 'cpf',
        hasDocument: true,
      }),
    };

    const useCase = new GetTransactionPayerUseCase(repository);

    const result = await useCase.execute({
      transactionId: 1,
    });

    expect(repository.getPayerByTransactionId).toHaveBeenCalledWith({
      transactionId: 1,
    });
    expect(result).toEqual({
      id: 10,
      externalId: 'cus_1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      documentType: 'cpf',
      hasDocument: true,
    });
  });

  it('deve falhar com ValidationError para id inválido', async () => {
    const repository = {
      list: vi.fn(),
      getById: vi.fn(),
      getPayerByTransactionId: vi.fn(),
    };

    const useCase = new GetTransactionPayerUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar com NotFoundError quando pagador não existir', async () => {
    const repository = {
      list: vi.fn(),
      getById: vi.fn(),
      getPayerByTransactionId: vi.fn().mockResolvedValue(null),
    };

    const useCase = new GetTransactionPayerUseCase(repository);

    await expect(
      useCase.execute({
        transactionId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
