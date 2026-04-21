import { describe, expect, it, vi } from 'vitest';
import { IdempotencyKeyResolver } from '../../modules/sync/application/services/IdempotencyKeyResolver';
import { IdempotencyService } from '../../modules/sync/application/services/IdempotencyService';
import { SafeMergePolicy } from '../../modules/sync/application/services/SafeMergePolicy';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';

describe('IdempotencyService', () => {
  function createTransaction(overrides?: Partial<TransactionEntity>): TransactionEntity {
    return {
      id: 0,
      externalReference: {
        psp: 'pagarme',
        externalId: 'or_123',
      },
      paymentMethod: 'credit_card',
      status: 'paid',
      originalAmount: { amountInCents: 10000 },
      netAmount: { amountInCents: 9700 },
      fees: { amountInCents: 300 },
      installmentCount: 3,
      currency: 'BRL',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:31:00.000Z'),
      payerSnapshot: {
        externalId: 'cus_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentHash: { value: 'hash-1' },
        documentType: 'cpf',
      },
      installments: [],
      metadata: {
        canonicalizedAt: new Date('2024-01-15T10:31:00.000Z'),
        sourceCapturedAt: new Date('2024-01-15T10:31:00.000Z'),
      },
      ...overrides,
    } as TransactionEntity;
  }

  it('deve marcar item inexistente como inserted', async () => {
    const repository = {
      findTransactionByKey: vi.fn().mockResolvedValue(null),
      registerDecision: vi.fn(),
    };

    const service = new IdempotencyService(
      new IdempotencyKeyResolver(),
      repository,
      new SafeMergePolicy(),
    );

    const transaction = createTransaction();

    const result = await service.handle({
      transaction,
      syncRunId: 'sync-1',
    });

    expect(result.decision).toBe('inserted');
    expect(repository.findTransactionByKey).toHaveBeenCalledWith({
      psp: 'pagarme',
      externalId: 'or_123',
    });
    expect(repository.registerDecision).toHaveBeenCalledWith({
      key: {
        psp: 'pagarme',
        externalId: 'or_123',
      },
      decision: 'inserted',
      syncRunId: 'sync-1',
      reason: 'New transaction',
    });
  });

  it('deve ignorar repetição equivalente', async () => {
    const existing = createTransaction();

    const repository = {
      findTransactionByKey: vi.fn().mockResolvedValue({
        transaction: existing,
      }),
      registerDecision: vi.fn(),
    };

    const service = new IdempotencyService(
      new IdempotencyKeyResolver(),
      repository,
      new SafeMergePolicy(),
    );

    const result = await service.handle({
      transaction: createTransaction(),
    });

    expect(result.decision).toBe('ignored_as_duplicate');
    expect(repository.registerDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'ignored_as_duplicate',
      }),
    );
  });

  it('deve retornar updated quando houver mudança permitida', async () => {
    const existing = createTransaction();

    const repository = {
      findTransactionByKey: vi.fn().mockResolvedValue({
        transaction: existing,
      }),
      registerDecision: vi.fn(),
    };

    const service = new IdempotencyService(
      new IdempotencyKeyResolver(),
      repository,
      new SafeMergePolicy(),
    );

    const result = await service.handle({
      transaction: createTransaction({
        status: 'pending',
        updatedAt: new Date('2024-01-15T10:40:00.000Z'),
      }),
    });

    expect(result.decision).toBe('updated');
    expect(repository.registerDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'updated',
      }),
    );
  });

  it('deve retornar conflicted quando houver divergência auditável', async () => {
    const existing = createTransaction();

    const repository = {
      findTransactionByKey: vi.fn().mockResolvedValue({
        transaction: existing,
      }),
      registerDecision: vi.fn(),
    };

    const service = new IdempotencyService(
      new IdempotencyKeyResolver(),
      repository,
      new SafeMergePolicy(),
    );

    const result = await service.handle({
      transaction: createTransaction({
        originalAmount: { amountInCents: 15000 },
      }),
    });

    expect(result.decision).toBe('conflicted');
    expect(repository.registerDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'conflicted',
      }),
    );
  });
});
