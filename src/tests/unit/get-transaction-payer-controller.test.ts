import { describe, expect, it, vi } from 'vitest';
import { GetTransactionPayerController } from '../../modules/transactions/presentation/http/controllers/GetTransactionPayerController';
import { TransactionPayerHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionPayerHttpMapper';

describe('GetTransactionPayerController', () => {
  it('deve chamar use case e responder 200', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
        id: 10,
        externalId: 'cus_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentType: 'cpf',
        hasDocument: true,
      }),
    };

    const controller = new GetTransactionPayerController(
      useCase as never,
      new TransactionPayerHttpMapper(),
    );

    const request = {
      params: {
        transactionId: 1,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await controller.handle(request as never, { status } as never);

    expect(useCase.execute).toHaveBeenCalledWith({
      transactionId: 1,
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({
      id: 10,
      externalId: 'cus_1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      documentType: 'cpf',
      hasDocument: true,
    });
  });

  it('deve propagar erro do use case', async () => {
    const useCase = {
      execute: vi.fn().mockRejectedValue(new Error('payer not found')),
    };

    const controller = new GetTransactionPayerController(
      useCase as never,
      new TransactionPayerHttpMapper(),
    );

    const request = {
      params: {
        transactionId: 999,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await expect(controller.handle(request as never, { status } as never)).rejects.toThrow(
      'payer not found',
    );
  });
});
