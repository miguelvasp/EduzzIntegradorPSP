import { describe, expect, it } from 'vitest';
import { IngestionValidationPipeline } from '../../modules/sync/application/validation/IngestionValidationPipeline';
import { ValidationFailureClassifier } from '../../modules/sync/application/validation/ValidationFailureClassifier';
import { AmountConsistencyValidator } from '../../modules/sync/application/validation/validators/AmountConsistencyValidator';
import { ExternalIdPresenceValidator } from '../../modules/sync/application/validation/validators/ExternalIdPresenceValidator';
import { InstallmentCompletenessValidator } from '../../modules/sync/application/validation/validators/InstallmentCompletenessValidator';
import { PayerDocumentValidator } from '../../modules/sync/application/validation/validators/PayerDocumentValidator';
import { PayerPresenceValidator } from '../../modules/sync/application/validation/validators/PayerPresenceValidator';
import { PaymentMethodScopeValidator } from '../../modules/sync/application/validation/validators/PaymentMethodScopeValidator';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';

describe('IngestionValidationPipeline', () => {
  function createPipeline() {
    const classifier = new ValidationFailureClassifier();

    return new IngestionValidationPipeline([
      new PaymentMethodScopeValidator(classifier),
      new PayerPresenceValidator(classifier),
      new PayerDocumentValidator(classifier),
      new InstallmentCompletenessValidator(classifier),
      new ExternalIdPresenceValidator(classifier),
      new AmountConsistencyValidator(classifier),
    ]);
  }

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
      installments: [
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 1,
          amount: { amountInCents: 3334 },
          fees: { amountInCents: 100 },
          status: 'paid',
        },
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 2,
          amount: { amountInCents: 3333 },
          fees: { amountInCents: 100 },
          status: 'paid',
        },
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 3,
          amount: { amountInCents: 3333 },
          fees: { amountInCents: 100 },
          status: 'paid',
        },
      ],
      metadata: {
        canonicalizedAt: new Date('2024-01-15T10:31:00.000Z'),
        sourceCapturedAt: new Date('2024-01-15T10:31:00.000Z'),
      },
      ...overrides,
    } as TransactionEntity;
  }

  it('deve aceitar item válido', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(createTransaction());

    expect(result).toEqual({
      isValid: true,
      status: 'valid',
      failures: [],
    });
  });

  it('deve rejeitar item fora do escopo de cartão de crédito', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        paymentMethod: 'pix' as never,
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'out_of_scope_payment_method')).toBe(true);
  });

  it('deve rejeitar item sem pagador', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        payerSnapshot: undefined,
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'missing_payer')).toBe(true);
  });

  it('deve rejeitar item com documento não tratável', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        payerSnapshot: {
          externalId: 'cus_1',
          name: 'Maria Silva',
          email: 'maria@example.com',
          documentHash: undefined as never,
          documentType: 'cpf',
        },
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'unprocessable_payer_document')).toBe(true);
  });

  it('deve rejeitar item sem parcelas completas', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        installmentCount: 3,
        installments: [],
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'incomplete_installments')).toBe(true);
  });

  it('deve rejeitar item sem externalId utilizável', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        externalReference: {
          psp: 'pagarme',
          externalId: '',
        },
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'missing_external_id')).toBe(true);
  });

  it('deve rejeitar item com inconsistência mínima de valor', () => {
    const pipeline = createPipeline();

    const result = pipeline.validate(
      createTransaction({
        originalAmount: { amountInCents: 9000 },
        netAmount: { amountInCents: 9700 },
      }),
    );

    expect(result.isValid).toBe(false);
    expect(result.failures.some((item) => item.code === 'invalid_amount_consistency')).toBe(true);
  });
});
