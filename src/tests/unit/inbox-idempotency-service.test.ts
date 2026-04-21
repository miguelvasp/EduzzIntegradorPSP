import { describe, expect, it, vi } from 'vitest';
import { InboxIdempotencyService } from '../../modules/outbox/application/services/InboxIdempotencyService';

describe('InboxIdempotencyService', () => {
  function createContext() {
    return {
      consumerName: 'reconciliation-consumer',
      messageId: 'msg-1',
      eventType: 'transaction.updated',
      aggregateType: 'transaction',
      aggregateId: '10',
      correlationId: 'corr-1',
    };
  }

  it('deve processar evento novo', async () => {
    const inboxRepository = {
      findByMessageIdAndConsumer: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue(undefined),
      markProcessing: vi.fn().mockResolvedValue(undefined),
      markProcessed: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      markIgnoredDuplicate: vi.fn().mockResolvedValue(undefined),
    };

    const handler = vi.fn().mockResolvedValue(undefined);

    const service = new InboxIdempotencyService(inboxRepository);

    const result = await service.consume(createContext(), handler);

    expect(inboxRepository.add).toHaveBeenCalledTimes(1);
    expect(inboxRepository.markProcessing).toHaveBeenCalledTimes(1);
    expect(inboxRepository.markProcessed).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.result).toBe('processed_successfully');
  });

  it('deve ignorar evento já processado', async () => {
    const inboxRepository = {
      findByMessageIdAndConsumer: vi.fn().mockResolvedValue({
        id: 'inbox-1',
        messageId: 'msg-1',
        eventType: 'transaction.updated',
        consumerName: 'reconciliation-consumer',
        aggregateType: 'transaction',
        aggregateId: '10',
        status: 'processed',
        receivedAt: '2026-04-21T12:00:00.000Z',
        processedAt: '2026-04-21T12:00:05.000Z',
        correlationId: 'corr-1',
      }),
      add: vi.fn(),
      markProcessing: vi.fn(),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
      markIgnoredDuplicate: vi.fn().mockResolvedValue(undefined),
    };

    const handler = vi.fn();

    const service = new InboxIdempotencyService(inboxRepository);

    const result = await service.consume(createContext(), handler);

    expect(handler).not.toHaveBeenCalled();
    expect(inboxRepository.markIgnoredDuplicate).toHaveBeenCalledWith('inbox-1');
    expect(result.result).toBe('ignored_duplicate');
  });

  it('deve marcar failed quando handler falhar', async () => {
    const inboxRepository = {
      findByMessageIdAndConsumer: vi.fn().mockResolvedValue(null),
      add: vi.fn().mockResolvedValue(undefined),
      markProcessing: vi.fn().mockResolvedValue(undefined),
      markProcessed: vi.fn(),
      markFailed: vi.fn().mockResolvedValue(undefined),
      markIgnoredDuplicate: vi.fn(),
    };

    const handler = vi.fn().mockRejectedValue(new Error('consumer failed'));

    const service = new InboxIdempotencyService(inboxRepository);

    const result = await service.consume(createContext(), handler);

    expect(inboxRepository.markFailed).toHaveBeenCalledTimes(1);
    expect(result.result).toBe('failed');
    expect(result.reason).toBe('consumer failed');
  });

  it('evento com falha anterior pode reprocessar', async () => {
    const inboxRepository = {
      findByMessageIdAndConsumer: vi.fn().mockResolvedValue({
        id: 'inbox-1',
        messageId: 'msg-1',
        eventType: 'transaction.updated',
        consumerName: 'reconciliation-consumer',
        aggregateType: 'transaction',
        aggregateId: '10',
        status: 'failed',
        receivedAt: '2026-04-21T12:00:00.000Z',
        correlationId: 'corr-1',
        lastError: 'old failure',
      }),
      add: vi.fn(),
      markProcessing: vi.fn().mockResolvedValue(undefined),
      markProcessed: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn(),
      markIgnoredDuplicate: vi.fn(),
    };

    const handler = vi.fn().mockResolvedValue(undefined);

    const service = new InboxIdempotencyService(inboxRepository);

    const result = await service.consume(createContext(), handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(inboxRepository.markProcessing).toHaveBeenCalledWith('inbox-1');
    expect(inboxRepository.markProcessed).toHaveBeenCalledTimes(1);
    expect(result.result).toBe('processed_successfully');
  });
});
