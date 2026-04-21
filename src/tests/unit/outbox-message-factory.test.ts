import { describe, expect, it } from 'vitest';
import { OutboxMessageFactory } from '../../modules/outbox/application/services/OutboxMessageFactory';

describe('OutboxMessageFactory', () => {
  it('deve criar mensagem com status pending', () => {
    const factory = new OutboxMessageFactory();

    const result = factory.create({
      eventType: 'transaction.ingested',
      aggregateType: 'transaction',
      aggregateId: 10,
      payload: {
        transactionId: 10,
        status: 'paid',
      },
    });

    expect(result.status).toBe('pending');
    expect(result.retryCount).toBe(0);
    expect(result.eventType).toBe('transaction.ingested');
    expect(result.aggregateType).toBe('transaction');
    expect(result.aggregateId).toBe('10');
  });

  it('deve criar mensagem com correlação', () => {
    const factory = new OutboxMessageFactory();

    const result = factory.create({
      eventType: 'transaction.updated',
      aggregateType: 'transaction',
      aggregateId: 'trx-10',
      payload: {
        transactionId: 10,
      },
      correlationId: 'corr-1',
      syncRunId: 'sync-1',
    });

    expect(result.correlationId).toBe('corr-1');
    expect(result.syncRunId).toBe('sync-1');
  });

  it('não deve incluir documento puro no payload', () => {
    const factory = new OutboxMessageFactory();

    const result = factory.create({
      eventType: 'transaction.ingested',
      aggregateType: 'transaction',
      aggregateId: 10,
      payload: {
        transactionId: 10,
        document: '12345678901',
        documentType: 'cpf',
      },
    });

    expect(result.payload).toEqual({
      transactionId: 10,
    });
  });

  it('não deve incluir hash do documento no payload', () => {
    const factory = new OutboxMessageFactory();

    const result = factory.create({
      eventType: 'transaction.updated',
      aggregateType: 'transaction',
      aggregateId: 10,
      payload: {
        transactionId: 10,
        documentHash: 'hash-123',
        payerHash: 'hash-456',
        status: 'paid',
      },
    });

    expect(result.payload).toEqual({
      transactionId: 10,
      status: 'paid',
    });
  });
});
