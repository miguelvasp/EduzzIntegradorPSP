import { describe, expect, it, vi } from 'vitest';
import { ListTransactionInstallmentsController } from '../../modules/transactions/presentation/http/controllers/ListTransactionInstallmentsController';
import { TransactionInstallmentHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionInstallmentHttpMapper';

describe('ListTransactionInstallmentsController', () => {
  it('deve chamar use case e responder 200', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue([
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
      ]),
    };

    const controller = new ListTransactionInstallmentsController(
      useCase as never,
      new TransactionInstallmentHttpMapper(),
    );

    const request = {
      params: {
        id: 10,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await controller.handle(request as never, { status } as never);

    expect(useCase.execute).toHaveBeenCalledWith({
      transactionId: 10,
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith([
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
    ]);
  });

  it('deve propagar erro do use case', async () => {
    const useCase = {
      execute: vi.fn().mockRejectedValue(new Error('transaction not found')),
    };

    const controller = new ListTransactionInstallmentsController(
      useCase as never,
      new TransactionInstallmentHttpMapper(),
    );

    const request = {
      params: {
        id: 999,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await expect(controller.handle(request as never, { status } as never)).rejects.toThrow(
      'transaction not found',
    );
  });
});
