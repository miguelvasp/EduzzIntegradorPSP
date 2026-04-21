import { describe, expect, it, vi } from 'vitest';
import { OutboxDispatcher } from '../../modules/outbox/application/services/OutboxDispatcher';
import type { OutboxMessage } from '../../modules/outbox/domain/OutboxMessage';

describe('OutboxDispatcher', () => {
  function createMessage(id: string): OutboxMessage {
    return {
      id,
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
    };
  }

  it('deve processar lote elegível', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn().mockResolvedValue([createMessage('m1')]),
      markProcessing: vi.fn().mockResolvedValue(true),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn(),
    };

    const outboxMessageProcessor = {
      process: vi.fn().mockResolvedValue({
        messageId: 'm1',
        eventType: 'transaction.updated',
        aggregateType: 'transaction',
        aggregateId: '10',
        result: 'processed_successfully',
        retryCount: 0,
      }),
    };

    const dispatcher = new OutboxDispatcher(outboxRepository, outboxMessageProcessor as never);

    await dispatcher.dispatch(10);

    expect(outboxRepository.findDispatchable).toHaveBeenCalledTimes(1);
    expect(outboxRepository.markProcessing).toHaveBeenCalledWith('m1');
    expect(outboxMessageProcessor.process).toHaveBeenCalledTimes(1);
  });

  it('não deve processar mensagem sem lock de processing', async () => {
    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn().mockResolvedValue([createMessage('m1')]),
      markProcessing: vi.fn().mockResolvedValue(false),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn(),
    };

    const outboxMessageProcessor = {
      process: vi.fn(),
    };

    const dispatcher = new OutboxDispatcher(outboxRepository, outboxMessageProcessor as never);

    await dispatcher.dispatch(10);

    expect(outboxMessageProcessor.process).not.toHaveBeenCalled();
  });

  it('deve isolar falha por mensagem e continuar o lote', async () => {
    const messages = [createMessage('m1'), createMessage('m2')];

    const outboxRepository = {
      add: vi.fn(),
      findDispatchable: vi.fn().mockResolvedValue(messages),
      markProcessing: vi.fn().mockResolvedValue(true),
      markProcessed: vi.fn(),
      scheduleRetry: vi.fn(),
      markDeadLettered: vi.fn(),
      markFailedTerminal: vi.fn(),
    };

    const outboxMessageProcessor = {
      process: vi.fn().mockRejectedValueOnce(new Error('first failed')).mockResolvedValueOnce({
        messageId: 'm2',
        eventType: 'transaction.updated',
        aggregateType: 'transaction',
        aggregateId: '10',
        result: 'processed_successfully',
        retryCount: 0,
      }),
    };

    const dispatcher = new OutboxDispatcher(outboxRepository, outboxMessageProcessor as never);

    await dispatcher.dispatch(10);

    expect(outboxMessageProcessor.process).toHaveBeenCalledTimes(2);
  });
});
