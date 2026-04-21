import { describe, expect, it } from 'vitest';
import { SafeMergePolicy } from '../../modules/sync/application/services/SafeMergePolicy';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';

describe('SafeMergePolicy', () => {
  function createTransaction(overrides?: Partial<TransactionEntity>): TransactionEntity {
    return {
      id: 1,
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

  it('deve ignorar repetição equivalente', () => {
    const policy = new SafeMergePolicy();

    const existing = createTransaction();
    const incoming = createTransaction();

    const result = policy.evaluate(existing, incoming);

    expect(result).toEqual({
      decision: 'ignored_as_duplicate',
      reason: 'Equivalent item or no material change',
    });
  });

  it('deve permitir update de campo mutável', () => {
    const policy = new SafeMergePolicy();

    const existing = createTransaction();
    const incoming = createTransaction({
      status: 'pending',
      updatedAt: new Date('2024-01-15T10:40:00.000Z'),
    });

    const result = policy.evaluate(existing, incoming);

    expect(result).toEqual({
      decision: 'updated',
      reason: 'Allowed mutable fields changed',
    });
  });

  it('deve conflitar quando campo auditável divergir', () => {
    const policy = new SafeMergePolicy();

    const existing = createTransaction();
    const incoming = createTransaction({
      originalAmount: { amountInCents: 15000 },
    });

    const result = policy.evaluate(existing, incoming);

    expect(result).toEqual({
      decision: 'conflicted',
      reason: 'Audit fields diverged',
    });
  });

  it('deve conflitar quando documento do pagador divergir', () => {
    const policy = new SafeMergePolicy();

    const existing = createTransaction();
    const incoming = createTransaction({
      payerSnapshot: {
        ...existing.payerSnapshot,
        documentHash: { value: 'hash-2' },
      },
    });

    const result = policy.evaluate(existing, incoming);

    expect(result.decision).toBe('conflicted');
  });
});
