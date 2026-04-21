import { describe, expect, it, vi } from 'vitest';
import { GetInstallmentByIdController } from '../../modules/transactions/presentation/http/controllers/GetInstallmentByIdController';
import { InstallmentDetailHttpMapper } from '../../modules/transactions/presentation/http/mappers/InstallmentDetailHttpMapper';

describe('GetInstallmentByIdController', () => {
  it('deve chamar use case e responder 200', async () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue({
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

    const controller = new GetInstallmentByIdController(
      useCase as never,
      new InstallmentDetailHttpMapper(),
    );

    const request = {
      params: {
        transactionId: 10,
        installmentId: 100,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await controller.handle(request as never, { status } as never);

    expect(useCase.execute).toHaveBeenCalledWith({
      transactionId: 10,
      installmentId: 100,
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({
      id: 100,
      transactionId: 10,
      installmentNumber: 1,
      amount: 3334,
      fees: 100,
      status: 'paid',
      dueAt: '2024-01-01T00:00:00.000Z',
      paidAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T10:00:00.000Z',
    });
  });

  it('deve propagar erro do use case', async () => {
    const useCase = {
      execute: vi.fn().mockRejectedValue(new Error('installment not found')),
    };

    const controller = new GetInstallmentByIdController(
      useCase as never,
      new InstallmentDetailHttpMapper(),
    );

    const request = {
      params: {
        transactionId: 10,
        installmentId: 999,
      },
    };

    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });

    await expect(controller.handle(request as never, { status } as never)).rejects.toThrow(
      'installment not found',
    );
  });
});
