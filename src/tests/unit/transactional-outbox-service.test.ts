import { describe, expect, it, vi } from 'vitest';
import { TransactionalOutboxService } from '../../modules/outbox/application/services/TransactionalOutboxService';
import type { OutboxMessage } from '../../modules/outbox/domain/OutboxMessage';

describe('TransactionalOutboxService', () => {
  function createOutboxMessage(): OutboxMessage {
    return {
      id: 'outbox-1',
      eventType: 'transaction.updated',
      aggregateType: 'transaction',
      aggregateId: '10',
      payload: {
        transactionId: 10,
        status: 'paid',
      },
      status: 'pending',
      createdAt: '2026-04-21T12:00:00.000Z',
      availableAt: '2026-04-21T12:00:00.000Z',
      correlationId: 'corr-1',
      syncRunId: 'sync-1',
      retryCount: 0,
    };
  }

  it('deve persistir estado e outbox juntos dentro do unit of work', async () => {
    const unitOfWork = {
      execute: vi.fn(async <T>(work: () => Promise<T>) => work()),
    };

    const outboxRepository = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    const persistState = vi.fn().mockResolvedValue({
      transactionId: 10,
    });

    const service = new TransactionalOutboxService(unitOfWork as never, outboxRepository as never);

    const result = await service.execute({
      persistState,
      outboxMessage: createOutboxMessage(),
    });

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(persistState).toHaveBeenCalledTimes(1);
    expect(outboxRepository.add).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      transactionId: 10,
    });
  });

  it('falha no outbox deve propagar erro', async () => {
    const unitOfWork = {
      execute: vi.fn(async <T>(work: () => Promise<T>) => work()),
    };

    const outboxRepository = {
      add: vi.fn().mockRejectedValue(new Error('outbox failed')),
    };

    const persistState = vi.fn().mockResolvedValue({
      transactionId: 10,
    });

    const service = new TransactionalOutboxService(unitOfWork as never, outboxRepository as never);

    await expect(
      service.execute({
        persistState,
        outboxMessage: createOutboxMessage(),
      }),
    ).rejects.toThrow('outbox failed');
  });

  it('falha no estado deve propagar erro', async () => {
    const unitOfWork = {
      execute: vi.fn(async <T>(work: () => Promise<T>) => work()),
    };

    const outboxRepository = {
      add: vi.fn(),
    };

    const persistState = vi.fn().mockRejectedValue(new Error('state failed'));

    const service = new TransactionalOutboxService(unitOfWork as never, outboxRepository as never);

    await expect(
      service.execute({
        persistState,
        outboxMessage: createOutboxMessage(),
      }),
    ).rejects.toThrow('state failed');
  });

  it('não deve chamar outbox quando persistState falhar antes', async () => {
    const unitOfWork = {
      execute: vi.fn(async <T>(work: () => Promise<T>) => work()),
    };

    const outboxRepository = {
      add: vi.fn(),
    };

    const persistState = vi.fn().mockRejectedValue(new Error('state failed'));

    const service = new TransactionalOutboxService(unitOfWork as never, outboxRepository as never);

    await expect(
      service.execute({
        persistState,
        outboxMessage: createOutboxMessage(),
      }),
    ).rejects.toThrow('state failed');

    expect(outboxRepository.add).not.toHaveBeenCalled();
  });
});
