import { CanonicalPaymentMethod, type TransactionEntity } from '../entities';

export const TransactionValidityIssueCode = {
  MISSING_EXTERNAL_PSP: 'missing_external_psp',
  MISSING_EXTERNAL_ID: 'missing_external_id',
  INVALID_PAYMENT_METHOD: 'invalid_payment_method',
  MISSING_PAYER_NAME: 'missing_payer_name',
  MISSING_PAYER_EMAIL: 'missing_payer_email',
  MISSING_PAYER_DOCUMENT_HASH: 'missing_payer_document_hash',
  MISSING_PAYER_DOCUMENT_TYPE: 'missing_payer_document_type',
  INVALID_INSTALLMENT_COUNT: 'invalid_installment_count',
  EMPTY_INSTALLMENTS: 'empty_installments',
  INSTALLMENT_COUNT_MISMATCH: 'installment_count_mismatch',
  INVALID_TRANSACTION_CURRENCY: 'invalid_transaction_currency',
  INVALID_ORIGINAL_AMOUNT: 'invalid_original_amount',
  INVALID_NET_AMOUNT: 'invalid_net_amount',
  INVALID_FEES: 'invalid_fees',
  MISSING_CREATED_AT: 'missing_created_at',
  MISSING_UPDATED_AT: 'missing_updated_at',
  INVALID_UPDATED_AT: 'invalid_updated_at',
  DUPLICATE_INSTALLMENT_NUMBER: 'duplicate_installment_number',
  INVALID_INSTALLMENT_NUMBER: 'invalid_installment_number',
  INCOMPLETE_INSTALLMENT_SEQUENCE: 'incomplete_installment_sequence',
  INVALID_INSTALLMENT_LINK: 'invalid_installment_link',
  INVALID_INSTALLMENT_AMOUNT: 'invalid_installment_amount',
  INVALID_INSTALLMENT_FEES: 'invalid_installment_fees',
  INVALID_INSTALLMENT_DUE_DATE: 'invalid_installment_due_date',
  INVALID_INSTALLMENT_PAID_AT: 'invalid_installment_paid_at',
} as const;

export type TransactionValidityIssueCode =
  (typeof TransactionValidityIssueCode)[keyof typeof TransactionValidityIssueCode];

export interface TransactionValidityResult {
  isValid: boolean;
  issueCodes: TransactionValidityIssueCode[];
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isValidCurrency(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidMoneyShape(amount: TransactionEntity['originalAmount'] | undefined, currency: string): boolean {
  return amount !== undefined
    && Number.isInteger(amount.amountInCents)
    && amount.amountInCents >= 0
    && isValidCurrency(currency);
}

export function validateTransactionCanonicalModel(transaction: TransactionEntity): TransactionValidityResult {
  const issueCodes = new Set<TransactionValidityIssueCode>();

  if (transaction.externalReference === undefined || transaction.externalReference.psp.trim().length === 0) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_EXTERNAL_PSP);
  }

  if (transaction.externalReference === undefined || transaction.externalReference.externalId.trim().length === 0) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_EXTERNAL_ID);
  }

  if (transaction.paymentMethod !== CanonicalPaymentMethod.CREDIT_CARD) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_PAYMENT_METHOD);
  }

  if (transaction.payerSnapshot === undefined || transaction.payerSnapshot.name.trim().length === 0) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_PAYER_NAME);
  }

  if (transaction.payerSnapshot === undefined || transaction.payerSnapshot.email.trim().length === 0) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_PAYER_EMAIL);
  }

  if (
    transaction.payerSnapshot === undefined
    || transaction.payerSnapshot.documentHash === undefined
    || transaction.payerSnapshot.documentHash.value.trim().length === 0
  ) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_HASH);
  }

  if (transaction.payerSnapshot === undefined || transaction.payerSnapshot.documentType.trim().length === 0) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_PAYER_DOCUMENT_TYPE);
  }

  if (!Number.isInteger(transaction.installmentCount) || transaction.installmentCount <= 0) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_COUNT);
  }

  if (!isValidCurrency(transaction.currency)) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_TRANSACTION_CURRENCY);
  }

  if (!isValidMoneyShape(transaction.originalAmount, transaction.currency)) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_ORIGINAL_AMOUNT);
  }

  if (!isValidMoneyShape(transaction.netAmount, transaction.currency)) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_NET_AMOUNT);
  }

  if (!isValidMoneyShape(transaction.fees, transaction.currency)) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_FEES);
  }

  if (!isValidDate(transaction.createdAt)) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_CREATED_AT);
  }

  if (!isValidDate(transaction.updatedAt)) {
    issueCodes.add(TransactionValidityIssueCode.MISSING_UPDATED_AT);
  }

  if (isValidDate(transaction.createdAt) && isValidDate(transaction.updatedAt) && transaction.updatedAt < transaction.createdAt) {
    issueCodes.add(TransactionValidityIssueCode.INVALID_UPDATED_AT);
  }

  if (transaction.installments.length === 0) {
    issueCodes.add(TransactionValidityIssueCode.EMPTY_INSTALLMENTS);
  }

  if (transaction.installments.length !== transaction.installmentCount) {
    issueCodes.add(TransactionValidityIssueCode.INSTALLMENT_COUNT_MISMATCH);
  }

  const uniqueInstallmentNumbers = new Set<number>();

  for (const installment of transaction.installments) {
    if (installment.transactionId !== transaction.id) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_LINK);
    }

    if (!Number.isInteger(installment.installmentNumber) || installment.installmentNumber <= 0) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_NUMBER);
    } else if (uniqueInstallmentNumbers.has(installment.installmentNumber)) {
      issueCodes.add(TransactionValidityIssueCode.DUPLICATE_INSTALLMENT_NUMBER);
    } else {
      uniqueInstallmentNumbers.add(installment.installmentNumber);
    }

    if (!isValidMoneyShape(installment.amount, transaction.currency)) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_AMOUNT);
    }

    if (!isValidMoneyShape(installment.fees, transaction.currency)) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_FEES);
    }

    if (installment.dueDate !== undefined && !isValidDate(installment.dueDate)) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_DUE_DATE);
    }

    if (installment.paidAt !== undefined && !isValidDate(installment.paidAt)) {
      issueCodes.add(TransactionValidityIssueCode.INVALID_INSTALLMENT_PAID_AT);
    }
  }

  if (Number.isInteger(transaction.installmentCount) && transaction.installmentCount > 0) {
    for (let installmentNumber = 1; installmentNumber <= transaction.installmentCount; installmentNumber += 1) {
      if (!uniqueInstallmentNumbers.has(installmentNumber)) {
        issueCodes.add(TransactionValidityIssueCode.INCOMPLETE_INSTALLMENT_SEQUENCE);
        break;
      }
    }
  }

  return {
    isValid: issueCodes.size === 0,
    issueCodes: [...issueCodes],
  };
}
