import {
  CanonicalDocumentType,
  CanonicalInstallmentStatus,
  CanonicalPaymentMethod,
  CanonicalTransactionStatus,
  type InstallmentEntity,
  type PayerSnapshot,
  type TransactionEntity,
} from '../../../modules/transactions/domain/entities';
import {
  CanonicalPsp,
  createDocumentHashValueObject,
  createExternalTransactionReferenceValueObject,
  createMoneyValueObject,
} from '../../../modules/transactions/domain/value-objects';

export function createPayerSnapshotFixture(overrides: Partial<PayerSnapshot> = {}): PayerSnapshot {
  return {
    externalId: 'payer-001',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    documentHash: createDocumentHashValueObject('a'.repeat(64)),
    documentType: CanonicalDocumentType.CPF,
    ...overrides,
  };
}

export function createInstallmentFixture(
  transactionId: number,
  installmentNumber: number,
  overrides: Partial<InstallmentEntity> = {},
): InstallmentEntity {
  return {
    id: installmentNumber,
    transactionId,
    installmentNumber,
    amount: createMoneyValueObject({ amountInCents: 5000 }),
    fees: createMoneyValueObject({ amountInCents: 250 }),
    status: CanonicalInstallmentStatus.PENDING,
    dueDate: new Date('2026-05-01T00:00:00.000Z'),
    paidAt: undefined,
    ...overrides,
  };
}

export function createTransactionFixture(
  overrides: Partial<TransactionEntity> = {},
): TransactionEntity {
  const id = overrides.id ?? 1;
  const installments = overrides.installments ?? [
    createInstallmentFixture(id, 1),
    createInstallmentFixture(id, 2),
  ];

  return {
    id,
    externalReference: createExternalTransactionReferenceValueObject({
      psp: CanonicalPsp.PAGARME,
      externalId: 'ext-transaction-001',
    }),
    paymentMethod: CanonicalPaymentMethod.CREDIT_CARD,
    status: CanonicalTransactionStatus.PENDING,
    originalAmount: createMoneyValueObject({ amountInCents: 10000 }),
    netAmount: createMoneyValueObject({ amountInCents: 9500 }),
    fees: createMoneyValueObject({ amountInCents: 500 }),
    installmentCount: installments.length,
    currency: 'BRL',
    createdAt: new Date('2026-04-20T10:00:00.000Z'),
    updatedAt: new Date('2026-04-20T10:05:00.000Z'),
    payerSnapshot: createPayerSnapshotFixture(),
    installments,
    metadata: {
      canonicalizedAt: new Date('2026-04-20T10:05:00.000Z'),
      sourceCapturedAt: new Date('2026-04-20T09:59:00.000Z'),
      lastSynchronizedAt: new Date('2026-04-20T10:05:00.000Z'),
    },
    ...overrides,
  };
}
