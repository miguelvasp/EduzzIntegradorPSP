import { describe, expect, it } from 'vitest';
import { CanonicalPaymentMethod } from '../../modules/transactions/domain/entities';
import {
  TransactionValidityIssueCode,
  validateTransactionCanonicalModel,
} from '../../modules/transactions/domain/policies';
import { createTransactionFixture } from './fixtures/transaction-fixtures';

describe('transaction ingestion validator', () => {
  it('deve aceitar transação válida de cartão com parcelas consistentes', () => {
    const transaction = createTransactionFixture();

    const result = validateTransactionCanonicalModel(transaction);

    expect(result).toEqual({
      isValid: true,
      issueCodes: [],
    });
  });

  it('deve rejeitar transação fora do escopo de cartão de crédito', () => {
    const transaction = createTransactionFixture({
      paymentMethod: 'pix' as typeof CanonicalPaymentMethod.CREDIT_CARD,
    });

    const result = validateTransactionCanonicalModel(transaction);

    expect(result.isValid).toBe(false);
    expect(result.issueCodes).toContain(TransactionValidityIssueCode.INVALID_PAYMENT_METHOD);
  });

  it('deve rejeitar ausência de pagador', () => {
    const transaction = createTransactionFixture({
      payerSnapshot: undefined as never,
    });

    const result = validateTransactionCanonicalModel(transaction);

    expect(result.isValid).toBe(false);
    expect(result.issueCodes).toEqual(
      expect.arrayContaining([
        TransactionValidityIssueCode.MISSING_PAYER_NAME,
        TransactionValidityIssueCode.MISSING_PAYER_EMAIL,
        TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_HASH,
        TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_TYPE,
      ]),
    );
  });

  it('deve rejeitar ausência de externalId utilizável', () => {
    const transaction = createTransactionFixture();

    transaction.externalReference.externalId = '   ';

    const result = validateTransactionCanonicalModel(transaction);

    expect(result.isValid).toBe(false);
    expect(result.issueCodes).toContain(TransactionValidityIssueCode.MISSING_EXTERNAL_ID);
  });

  it('deve rejeitar parcelas incompletas', () => {
    const transaction = createTransactionFixture({
      installmentCount: 3,
      installments: [
        {
          ...createTransactionFixture().installments[0],
          installmentNumber: 1,
        },
        {
          ...createTransactionFixture().installments[1],
          installmentNumber: 3,
        },
      ],
    });

    const result = validateTransactionCanonicalModel(transaction);

    expect(result.isValid).toBe(false);
    expect(result.issueCodes).toContain(
      TransactionValidityIssueCode.INCOMPLETE_INSTALLMENT_SEQUENCE,
    );
    expect(result.issueCodes).toContain(TransactionValidityIssueCode.INSTALLMENT_COUNT_MISMATCH);
  });

  it('deve rejeitar valores monetários inconsistentes', () => {
    const transaction = createTransactionFixture({
      originalAmount: { amountInCents: -1 },
    } as never);

    const result = validateTransactionCanonicalModel(transaction);

    expect(result.isValid).toBe(false);
    expect(result.issueCodes).toContain(TransactionValidityIssueCode.INVALID_ORIGINAL_AMOUNT);
  });
});
