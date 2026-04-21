import { describe, expect, it, vi } from 'vitest';
import { DeadLetterService } from '../../modules/outbox/application/services/DeadLetterService';
import { OutboxMessageProcessor } from '../../modules/outbox/application/services/OutboxMessageProcessor';
import { OutboxRetryPolicy } from '../../modules/outbox/application/services/OutboxRetryPolicy';
import type { OutboxMessage } from '../../modules/outbox/domain/OutboxMessage';

describe('OutboxMessageProcessor', () => {
  function createMessage(overrides?: Partial<OutboxMessage>): OutboxMessage {
    return {
      id: 'msg-1',
      eventType: 'transaction.updated',
      aggregateType: 'transaction',
      aggregateId: '10',
      payload: {
        transactionId: 10,
      },
      status: 'pending',
      createdAt: '2026-04-21T12:00:00.000Z',
      availableAt: '2026-04-21T12:00:00.000Z',
      retryCount: 0,
      ...overrides,
    };
  }

  it('deve processar com sucesso', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn(),
      markProcessing: vi.fn(),
      markProcessed: vi.fn().mockResolvedValue(undefined),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn(),
    };

    const processor = new OutboxMessageProcessor(
      outboxRepository,
      new OutboxRetryPolicy({
        maxRetries: 3,
        baseDelaySeconds: 10,
      }),
      new DeadLetterService(outboxRepository),
      vi.fn().mockResolvedValue(undefined),
    );

    const result = await processor.process(createMessage());

    expect(result.result).toBe('processed_successfully');
    expect(outboxRepository.markProcessed).toHaveBeenCalledTimes(1);
  });

  it('deve agendar retry em erro transitório', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn(),
      markProcessing: vi.fn(),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn().mockResolvedValue(undefined),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn(),
    };

    const processor = new OutboxMessageProcessor(
      outboxRepository,
      new OutboxRetryPolicy({
        maxRetries: 3,
        baseDelaySeconds: 10,
      }),
      new DeadLetterService(outboxRepository),
      vi.fn().mockRejectedValue(new Error('timeout')),
    );

    const result = await processor.process(createMessage());

    expect(result.result).toBe('retry_scheduled');
    expect(outboxRepository.scheduleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve enviar para dead-letter ao exceder tentativas', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn(),
      markProcessing: vi.fn(),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn().mockResolvedValue(undefined),
      markFailedTerminal: vi.fn(),
    };

    const processor = new OutboxMessageProcessor(
      outboxRepository,
      new OutboxRetryPolicy({
        maxRetries: 1,
        baseDelaySeconds: 10,
      }),
      new DeadLetterService(outboxRepository),
      vi.fn().mockRejectedValue(new Error('timeout')),
    );

    const result = await processor.process(
      createMessage({
        retryCount: 1,
      }),
    );

    expect(result.result).toBe('dead_lettered');
    expect(outboxRepository.markDeadLettered).toHaveBeenCalledTimes(1);
  });

  it('deve marcar failed_terminal em erro não retentável', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn(),
      markProcessing: vi.fn(),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn().mockResolvedValue(undefined),
    };

    const processor = new OutboxMessageProcessor(
      outboxRepository,
      new OutboxRetryPolicy({
        maxRetries: 3,
        baseDelaySeconds: 10,
      }),
      new DeadLetterService(outboxRepository),
      vi.fn().mockRejectedValue(new Error('invalid payload')),
    );

    const result = await processor.process(createMessage());

    expect(result.result).toBe('failed_terminal');
    expect(outboxRepository.markFailedTerminal).toHaveBeenCalledTimes(1);
  });
});
