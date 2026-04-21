import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../modules/shared/application/errors';
import { IdempotencyKeyResolver } from '../../modules/sync/application/services/IdempotencyKeyResolver';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';

describe('IdempotencyKeyResolver', () => {
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

  it('deve gerar chave com psp e externalId', () => {
    const resolver = new IdempotencyKeyResolver();

    const result = resolver.resolve(createTransaction());

    expect(result).toEqual({
      psp: 'pagarme',
      externalId: 'or_123',
    });
  });

  it('deve falhar sem externalId', () => {
    const resolver = new IdempotencyKeyResolver();

    expect(() =>
      resolver.resolve(
        createTransaction({
          externalReference: {
            psp: 'pagarme',
            externalId: '',
          },
        }),
      ),
    ).toThrow(ValidationError);
  });

  it('deve falhar sem psp', () => {
    const resolver = new IdempotencyKeyResolver();

    expect(() =>
      resolver.resolve(
        createTransaction({
          externalReference: {
            psp: undefined as never,
            externalId: 'or_123',
          },
        }),
      ),
    ).toThrow(ValidationError);
  });
});
