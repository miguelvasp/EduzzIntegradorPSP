import { describe, expect, it, vi } from 'vitest';
import { GetTransactionByIdController } from '../../modules/transactions/presentation/http/controllers/GetTransactionByIdController';
import { TransactionDetailHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionDetailHttpMapper';

describe('GetTransactionByIdController', () => {
  it('deve chamar use case e responder 200', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
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

    const controller = new GetTransactionByIdController(
      useCase as never,
      new TransactionDetailHttpMapper(),
    );

    const request = {
      params: {
        id: 1,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await controller.handle(request as never, { status } as never);

    expect(useCase.execute).toHaveBeenCalledWith({
      id: 1,
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({
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
  });

  it('deve propagar erro do use case', async () => {
    const error = new Error('transaction not found');

    const useCase = {
      execute: vi.fn().mockRejectedValue(error),
    };

    const controller = new GetTransactionByIdController(
      useCase as never,
      new TransactionDetailHttpMapper(),
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
