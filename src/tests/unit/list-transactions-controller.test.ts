import { describe, expect, it, vi } from 'vitest';
import { ListTransactionsController } from '../../modules/transactions/presentation/http/controllers/ListTransactionsController';
import { TransactionListHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionListHttpMapper';

describe('ListTransactionsController', () => {
  it('deve chamar use case e responder 200 com paginação', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
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
      }),
    };

    const controller = new ListTransactionsController(
      useCase as never,
      new TransactionListHttpMapper(),
    );

    const request = {
      query: {
        status: 'paid',
        page: 1,
        limit: 20,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await controller.handle(request as never, { status } as never);

    expect(useCase.execute).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
      status: 'paid',
      psp: undefined,
      payerDocument: undefined,
      page: 1,
      limit: 20,
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({
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
  });

  it('deve propagar erro do use case', async () => {
    const error = new Error('invalid query');

    const useCase = {
      execute: vi.fn().mockRejectedValue(error),
    };

    const controller = new ListTransactionsController(
      useCase as never,
      new TransactionListHttpMapper(),
    );

    const request = {
      query: {},
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await expect(controller.handle(request as never, { status } as never)).rejects.toThrow(
      'invalid query',
    );
  });
});
