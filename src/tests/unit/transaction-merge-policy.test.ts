import { describe, expect, it } from 'vitest';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';
import { TransactionMergePolicy } from '../../modules/transactions/domain/policies/TransactionMergePolicy';
import { TransactionStatusTransitionPolicy } from '../../modules/transactions/domain/policies/TransactionStatusTransitionPolicy';
import { ConflictClassifier } from '../../modules/transactions/domain/services/ConflictClassifier';

describe('TransactionMergePolicy', () => {
  function createTransaction(overrides?: Partial<TransactionEntity>): TransactionEntity {
    return {
      id: 1,
      externalReference: {
        psp: 'pagarme',
        externalId: 'or_123',
      },
      paymentMethod: 'credit_card',
      status: 'pending',
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
      installments: [
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 1,
          amount: { amountInCents: 3334 },
          fees: { amountInCents: 100 },
          status: 'pending',
        },
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 2,
          amount: { amountInCents: 3333 },
          fees: { amountInCents: 100 },
          status: 'pending',
        },
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 3,
          amount: { amountInCents: 3333 },
          fees: { amountInCents: 100 },
          status: 'pending',
        },
      ],
      metadata: {
        canonicalizedAt: new Date('2024-01-15T10:31:00.000Z'),
        sourceCapturedAt: new Date('2024-01-15T10:31:00.000Z'),
      },
      ...overrides,
    } as TransactionEntity;
  }

  function createPolicy() {
    return new TransactionMergePolicy(
      new TransactionStatusTransitionPolicy(),
      new ConflictClassifier(),
    );
  }

  it('deve retornar no_change quando nada mudou', () => {
    const policy = createPolicy();

    const current = createTransaction();
    const incoming = createTransaction();

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('no_change');
  });

  it('deve retornar safe_update para update operacional permitido', () => {
    const policy = createPolicy();

    const current = createTransaction();
    const incoming = createTransaction({
      status: 'paid',
      updatedAt: new Date('2024-01-15T10:40:00.000Z'),
      payerSnapshot: {
        ...current.payerSnapshot,
        email: 'novo-email@example.com',
      },
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('safe_update');
    expect(result.updatedFields).toContain('status');
    expect(result.updatedFields).toContain('updatedAt');
    expect(result.updatedFields).toContain('payerSnapshot.email');
  });

  it('deve detectar conflito financeiro em originalAmount', () => {
    const policy = createPolicy();

    const current = createTransaction();
    const incoming = createTransaction({
      originalAmount: { amountInCents: 15000 },
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('conflict_detected');
    expect(result.conflictType).toBe('financial_divergence');
  });

  it('deve detectar conflito de identidade do pagador', () => {
    const policy = createPolicy();

    const current = createTransaction();
    const incoming = createTransaction({
      payerSnapshot: {
        ...current.payerSnapshot,
        documentHash: { value: 'hash-2' },
      },
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('conflict_detected');
    expect(result.conflictType).toBe('payer_identity_divergence');
  });

  it('deve detectar conflito de parcelas', () => {
    const policy = createPolicy();

    const current = createTransaction();
    const incoming = createTransaction({
      installments: [
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 1,
          amount: { amountInCents: 9999 },
          fees: { amountInCents: 100 },
          status: 'pending',
        },
      ],
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('conflict_detected');
    expect(result.conflictType).toBe('installment_divergence');
  });

  it('deve detectar regressão inválida de status como conflito', () => {
    const policy = createPolicy();

    const current = createTransaction({
      status: 'paid',
    });

    const incoming = createTransaction({
      status: 'pending',
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('conflict_detected');
    expect(result.conflictType).toBe('invalid_status_regression');
  });

  it('deve exigir reconciliação para transição suspeita', () => {
    const policy = createPolicy();

    const current = createTransaction({
      status: 'unknown',
    });

    const incoming = createTransaction({
      status: 'paid',
    });

    const result = policy.evaluate(current, incoming);

    expect(result.decision).toBe('reconciliation_required');
  });
});
