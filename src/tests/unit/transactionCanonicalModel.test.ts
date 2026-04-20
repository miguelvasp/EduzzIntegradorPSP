import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CanonicalDocumentType,
  CanonicalInstallmentStatus,
  CanonicalPaymentMethod,
  CanonicalTransactionStatus,
  type InstallmentEntity,
  type PayerSnapshot,
  type TransactionEntity,
} from '../../modules/transactions/domain/entities';
import {
  createTransactionAuditEnvelope,
  isAuditableTransactionField,
  isUpdatableTransactionField,
  TransactionValidityIssueCode,
  validateTransactionCanonicalModel,
} from '../../modules/transactions/domain/policies';
import { TransactionDomainEventType, type TransactionCanonicalizedEvent } from '../../modules/transactions/domain/events';
import {
  createDocumentHashValueObject,
  CanonicalPsp,
  createExternalTransactionReferenceValueObject,
  createMoneyValueObject,
  getExternalTransactionReferenceKey,
} from '../../modules/transactions/domain/value-objects';

function buildPayerSnapshot(overrides: Partial<PayerSnapshot> = {}): PayerSnapshot {
  return {
    externalId: 'payer-001',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    documentHash: createDocumentHashValueObject('a'.repeat(64)),
    documentType: CanonicalDocumentType.CPF,
    ...overrides,
  };
}

function buildInstallment(
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

function buildTransaction(overrides: Partial<TransactionEntity> = {}): TransactionEntity {
  const id = overrides.id ?? 1;
  const installments = overrides.installments ?? [buildInstallment(id, 1), buildInstallment(id, 2)];

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
    payerSnapshot: buildPayerSnapshot(),
    installments,
    metadata: {
      canonicalizedAt: new Date('2026-04-20T10:05:00.000Z'),
      sourceCapturedAt: new Date('2026-04-20T09:59:00.000Z'),
      lastSynchronizedAt: new Date('2026-04-20T10:05:00.000Z'),
    },
    ...overrides,
  };
}

function listDomainFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      return listDomainFiles(entryPath);
    }

    return entryPath.endsWith('.ts') ? [entryPath] : [];
  });
}

describe('transaction canonical model', () => {
  describe('value objects', () => {
    it('should create money with cents', () => {
      const money = createMoneyValueObject({
        amountInCents: 12345,
      });

      expect(money).toEqual({
        amountInCents: 12345,
      });
    });

    it('should reject invalid money inputs', () => {
      expect(() => createMoneyValueObject({ amountInCents: -1 })).toThrow(
        'Money amount must be a non-negative integer in cents',
      );
      expect(() => createMoneyValueObject({ amountInCents: 10.5 })).toThrow(
        'Money amount must be a non-negative integer in cents',
      );
    });

    it('should accept a document hash and reject plain document-shaped values', () => {
      expect(createDocumentHashValueObject('abcdef1234567890fedcba0987654321')).toEqual({
        value: 'abcdef1234567890fedcba0987654321',
      });

      expect(() => createDocumentHashValueObject('12345678901')).toThrow(
        'Document hash must have at least 16 characters',
      );
      expect(() => createDocumentHashValueObject('12345678901234567')).toThrow(
        'Document hash cannot be a plain numeric document',
      );
      expect(() => createDocumentHashValueObject('123.456.789-00-hash')).toThrow(
        'Document hash cannot contain document formatting characters',
      );
    });

    it('should create an external transaction reference from psp and external id', () => {
      const reference = createExternalTransactionReferenceValueObject({
        psp: CanonicalPsp.MERCADOPAGO,
        externalId: ' external-123 ',
      });

      expect(reference).toEqual({
        psp: CanonicalPsp.MERCADOPAGO,
        externalId: 'external-123',
      });
      expect(getExternalTransactionReferenceKey(reference)).toBe('mercadopago:external-123');
    });

    it('should reject invalid external transaction references', () => {
      expect(() =>
        createExternalTransactionReferenceValueObject({
          psp: '' as CanonicalPsp,
          externalId: 'external-123',
        }),
      ).toThrow('External transaction reference must contain a PSP');

      expect(() =>
        createExternalTransactionReferenceValueObject({
          psp: CanonicalPsp.PAGARME,
          externalId: '   ',
        }),
      ).toThrow('External transaction reference must contain a usable externalId');
    });
  });

  describe('entities', () => {
    it('should represent a canonical transaction with external reference, payer snapshot and installments', () => {
      const transaction = buildTransaction();

      expect(transaction.externalReference.psp).toBe(CanonicalPsp.PAGARME);
      expect(transaction.externalReference.externalId).toBe('ext-transaction-001');
      expect(transaction.payerSnapshot).toMatchObject({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        documentType: CanonicalDocumentType.CPF,
      });
      expect(transaction.installments).toHaveLength(2);
      expect(transaction.installments.map((installment) => installment.transactionId)).toEqual([
        transaction.id,
        transaction.id,
      ]);
    });

    it('should support the canonical transaction statuses implemented by the domain', () => {
      expect(Object.values(CanonicalTransactionStatus)).toEqual([
        'pending',
        'paid',
        'canceled',
        'refunded',
        'failed',
        'disputed',
        'partially_refunded',
        'unknown',
      ]);
    });

    it('should represent a canonical installment with transaction linkage and monetary fields', () => {
      const installment = buildInstallment(1, 2, {
        status: CanonicalInstallmentStatus.SCHEDULED,
      });

      expect(installment).toMatchObject({
        transactionId: 1,
        installmentNumber: 2,
        status: CanonicalInstallmentStatus.SCHEDULED,
      });
      expect(installment.amount.amountInCents).toBe(5000);
      expect(installment.fees.amountInCents).toBe(250);
    });

    it('should represent a canonical payer snapshot without plain document fields', () => {
      const payerSnapshot = buildPayerSnapshot();

      expect(payerSnapshot).toMatchObject({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        documentType: CanonicalDocumentType.CPF,
      });
      expect(payerSnapshot.documentHash.value).toHaveLength(64);
      expect('document' in payerSnapshot).toBe(false);
      expect(Object.keys(payerSnapshot)).not.toContain('document');
    });

    it('should keep payerSnapshot as the canonical payer representation inside the transaction context', () => {
      const payerEntityFile = readFileSync(
        resolve(process.cwd(), 'src/modules/transactions/domain/entities/payer.entity.ts'),
        'utf8',
      );

      expect(payerEntityFile).toContain('export interface PayerSnapshot');
      expect(payerEntityFile).not.toContain('export type PayerEntity = PayerSnapshot');
    });
  });

  describe('validity policy', () => {
    it('should accept a valid credit card transaction with complete installments', () => {
      const transaction = buildTransaction({
        installments: [buildInstallment(1, 2), buildInstallment(1, 1)],
        installmentCount: 2,
      });

      const result = validateTransactionCanonicalModel(transaction);

      expect(result).toEqual({
        isValid: true,
        issueCodes: [],
      });
    });

    it('should reject missing or invalid external reference data', () => {
      const missingExternalId = buildTransaction({
        externalReference: createExternalTransactionReferenceValueObject({
          psp: CanonicalPsp.PAGARME,
          externalId: 'valid',
        }),
      });
      missingExternalId.externalReference.externalId = '   ';

      const missingPsp = buildTransaction({
        externalReference: {
          psp: '' as CanonicalPsp,
          externalId: 'external-123',
        },
      });

      expect(validateTransactionCanonicalModel(missingExternalId).issueCodes).toContain(
        TransactionValidityIssueCode.MISSING_EXTERNAL_ID,
      );
      expect(validateTransactionCanonicalModel(missingPsp).issueCodes).toContain(
        TransactionValidityIssueCode.MISSING_EXTERNAL_PSP,
      );
    });

    it('should reject missing payer snapshot and document hash', () => {
      const missingPayerSnapshot = buildTransaction({
        payerSnapshot: undefined as unknown as PayerSnapshot,
      });
      const missingDocumentHash = buildTransaction({
        payerSnapshot: buildPayerSnapshot({
          documentHash: undefined as unknown as PayerSnapshot['documentHash'],
        }),
      });

      expect(validateTransactionCanonicalModel(missingPayerSnapshot).issueCodes).toEqual(
        expect.arrayContaining([
          TransactionValidityIssueCode.MISSING_PAYER_NAME,
          TransactionValidityIssueCode.MISSING_PAYER_EMAIL,
          TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_HASH,
          TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_TYPE,
        ]),
      );
      expect(validateTransactionCanonicalModel(missingDocumentHash).issueCodes).toContain(
        TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_HASH,
      );
    });

    it('should reject empty installments and inconsistent installment count', () => {
      const transaction = buildTransaction({
        installments: [],
        installmentCount: 2,
      });

      expect(validateTransactionCanonicalModel(transaction).issueCodes).toEqual(
        expect.arrayContaining([
          TransactionValidityIssueCode.EMPTY_INSTALLMENTS,
          TransactionValidityIssueCode.INSTALLMENT_COUNT_MISMATCH,
          TransactionValidityIssueCode.INCOMPLETE_INSTALLMENT_SEQUENCE,
        ]),
      );
    });

    it('should reject duplicate installment numbers and incomplete sequence independently of array order', () => {
      const transactionWithDuplicate = buildTransaction({
        installments: [
          buildInstallment(1, 2),
          buildInstallment(1, 2),
          buildInstallment(1, 1),
        ],
        installmentCount: 3,
      });

      const transactionWithGap = buildTransaction({
        installments: [buildInstallment(1, 3), buildInstallment(1, 1)],
        installmentCount: 2,
      });

      expect(validateTransactionCanonicalModel(transactionWithDuplicate).issueCodes).toEqual(
        expect.arrayContaining([
          TransactionValidityIssueCode.DUPLICATE_INSTALLMENT_NUMBER,
          TransactionValidityIssueCode.INCOMPLETE_INSTALLMENT_SEQUENCE,
        ]),
      );
      expect(validateTransactionCanonicalModel(transactionWithGap).issueCodes).toContain(
        TransactionValidityIssueCode.INCOMPLETE_INSTALLMENT_SEQUENCE,
      );
    });

    it('should reject installments with invalid linkage and invalid payment method', () => {
      const transaction = buildTransaction({
        paymentMethod: 'pix' as typeof CanonicalPaymentMethod.CREDIT_CARD,
        installments: [buildInstallment(99, 1)],
        installmentCount: 1,
      });

      expect(validateTransactionCanonicalModel(transaction).issueCodes).toEqual(
        expect.arrayContaining([
          TransactionValidityIssueCode.INVALID_PAYMENT_METHOD,
          TransactionValidityIssueCode.INVALID_INSTALLMENT_LINK,
        ]),
      );
    });
  });

  describe('audit policy and event structure', () => {
    it('should expose auditable and updatable field semantics without duplicating entity state', () => {
      const transaction = buildTransaction();
      const envelope = createTransactionAuditEnvelope(transaction);

      expect(isAuditableTransactionField('externalReference')).toBe(true);
      expect(isAuditableTransactionField('status')).toBe(false);
      expect(isUpdatableTransactionField('status')).toBe(true);
      expect(isUpdatableTransactionField('payerSnapshot')).toBe(false);
      expect(envelope.auditable.externalReference).toBe(transaction.externalReference);
      expect(envelope.auditable.payerSnapshot).toBe(transaction.payerSnapshot);
      expect(envelope.updatable.status).toBe(transaction.status);
      expect(envelope.updatable.installments).toBe(transaction.installments);
    });

    it('should expose the canonicalization event as a lightweight domain event', () => {
      const transaction = buildTransaction();
      const event: TransactionCanonicalizedEvent = {
        eventId: 'event-001',
        type: TransactionDomainEventType.TRANSACTION_CANONICALIZED,
        occurredAt: new Date('2026-04-20T10:06:00.000Z'),
        transactionId: transaction.id,
        externalReference: transaction.externalReference,
        canonicalStatus: CanonicalTransactionStatus.PENDING,
        accepted: true,
        issueCodes: [],
      };

      expect(event).toEqual({
        eventId: 'event-001',
        type: 'transaction.canonicalized',
        occurredAt: new Date('2026-04-20T10:06:00.000Z'),
        transactionId: 1,
        externalReference: transaction.externalReference,
        canonicalStatus: 'pending',
        accepted: true,
        issueCodes: [],
      });
    });
  });

  describe('technical guards', () => {
    it('should keep the canonical installment statuses implemented by the domain', () => {
      expect(Object.values(CanonicalInstallmentStatus)).toEqual([
        'pending',
        'scheduled',
        'paid',
        'canceled',
        'failed',
        'unknown',
      ]);
    });

    it('should keep the canonical domain free from forbidden external payload naming', () => {
      const domainRoot = resolve(process.cwd(), 'src/modules/transactions/domain');
      const domainFiles = listDomainFiles(domainRoot);
      const forbiddenPatterns = [
        /\bcharges\b/,
        /last_transaction/,
        /payment_type_id/,
        /date_created/,
        /status_detail/,
        /fee_details/,
        /customer\.type/,
        /\border\b/,
        /\bpayment\b/,
      ];

      const offenders = domainFiles.filter((filePath) => {
        const fileContent = readFileSync(filePath, 'utf8');

        return forbiddenPatterns.some((pattern) => pattern.test(fileContent));
      });

      expect(offenders).toEqual([]);
    });

    it('should keep the minimum canonical domain structure present', () => {
      const expectedFiles = [
        'entities/installment.entity.ts',
        'entities/payer.entity.ts',
        'entities/transaction.entity.ts',
        'events/transaction-canonicalized.event.ts',
        'policies/auditable-fields.policy.ts',
        'policies/transaction-validity.policy.ts',
        'value-objects/document-hash.value-object.ts',
        'value-objects/external-transaction-reference.value-object.ts',
        'value-objects/money.value-object.ts',
      ];

      const domainRoot = resolve(process.cwd(), 'src/modules/transactions/domain');

      for (const relativePath of expectedFiles) {
        const absolutePath = resolve(domainRoot, relativePath);
        const fileContent = readFileSync(absolutePath, 'utf8');

        expect(fileContent.length).toBeGreaterThan(0);
      }
    });
  });
});
