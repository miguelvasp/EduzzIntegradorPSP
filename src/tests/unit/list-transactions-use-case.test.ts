import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../modules/shared/application/errors';
import { ListTransactionsUseCase } from '../../modules/transactions/application/use-cases/ListTransactionsUseCase';

describe('ListTransactionsUseCase', () => {
  it('deve aplicar defaults de page e limit', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    };

    const useCase = new ListTransactionsUseCase(repository);

    const result = await useCase.execute({});

    expect(repository.list).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
      status: undefined,
      psp: undefined,
      payerDocument: undefined,
      page: 1,
      limit: 20,
    });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('deve calcular totalPages corretamente', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({
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
        total: 45,
      }),
    };

    const useCase = new ListTransactionsUseCase(repository);

    const result = await useCase.execute({
      page: 2,
      limit: 20,
    });

    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it('deve falhar para page inválida', async () => {
    const repository = {
      list: vi.fn(),
    };

    const useCase = new ListTransactionsUseCase(repository);

    await expect(
      useCase.execute({
        page: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar para limit inválido', async () => {
    const repository = {
      list: vi.fn(),
    };

    const useCase = new ListTransactionsUseCase(repository);

    await expect(
      useCase.execute({
        limit: 101,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar para intervalo de datas inválido', async () => {
    const repository = {
      list: vi.fn(),
    };

    const useCase = new ListTransactionsUseCase(repository);

    await expect(
      useCase.execute({
        startDate: '2024-02-01',
        endDate: '2024-01-01',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve retornar resposta vazia sem erro', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    };

    const useCase = new ListTransactionsUseCase(repository);

    const result = await useCase.execute({
      status: 'paid',
    });

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });
});
