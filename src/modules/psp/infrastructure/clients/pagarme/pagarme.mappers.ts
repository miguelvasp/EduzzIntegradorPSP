import { DomainError, ValidationError } from '../../../../shared/application/errors';
import { DocumentType } from '../../../../shared/domain/enums/documentType';
import { PspType } from '../../../../shared/domain/enums/pspType';
import { TransactionStatus } from '../../../../shared/domain/enums/transactionStatus';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import {
  CanonicalDocumentType,
  CanonicalTransactionStatus,
} from '../../../../transactions/domain/entities';
import type {
  PagarmeChargeResponse,
  PagarmeCustomerResponse,
  PagarmeOrderResponse,
} from './pagarme.schemas';

export function mapPagarmeTransactionStatus(
  orderStatus?: string,
  chargeStatus?: string,
  transactionStatus?: string,
): CanonicalTransactionStatus {
  const normalizedTransactionStatus = normalizeString(transactionStatus);
  const normalizedChargeStatus = normalizeString(chargeStatus);
  const normalizedOrderStatus = normalizeString(orderStatus);

  if (
    normalizedTransactionStatus === 'captured' ||
    normalizedChargeStatus === 'paid' ||
    normalizedOrderStatus === 'paid'
  ) {
    return TransactionStatus.PAID;
  }

  if (
    normalizedTransactionStatus === 'refunded' ||
    normalizedChargeStatus === 'refunded' ||
    normalizedOrderStatus === 'refunded'
  ) {
    return TransactionStatus.REFUNDED;
  }

  if (
    normalizedTransactionStatus === 'partial_refund' ||
    normalizedTransactionStatus === 'partially_refunded' ||
    normalizedChargeStatus === 'partial_refund' ||
    normalizedChargeStatus === 'partially_refunded' ||
    normalizedOrderStatus === 'partial_refund' ||
    normalizedOrderStatus === 'partially_refunded'
  ) {
    return TransactionStatus.PARTIALLY_REFUNDED;
  }

  if (
    normalizedTransactionStatus === 'waiting_payment' ||
    normalizedTransactionStatus === 'processing' ||
    normalizedChargeStatus === 'pending' ||
    normalizedChargeStatus === 'processing' ||
    normalizedOrderStatus === 'pending' ||
    normalizedOrderStatus === 'processing'
  ) {
    return TransactionStatus.PENDING;
  }

  if (
    normalizedTransactionStatus === 'failed' ||
    normalizedChargeStatus === 'failed' ||
    normalizedOrderStatus === 'failed'
  ) {
    return TransactionStatus.FAILED;
  }

  if (
    normalizedTransactionStatus === 'canceled' ||
    normalizedChargeStatus === 'canceled' ||
    normalizedOrderStatus === 'canceled'
  ) {
    return TransactionStatus.CANCELED;
  }

  if (
    normalizedTransactionStatus === 'chargedback' ||
    normalizedTransactionStatus === 'disputed' ||
    normalizedChargeStatus === 'chargedback' ||
    normalizedChargeStatus === 'disputed' ||
    normalizedOrderStatus === 'chargedback' ||
    normalizedOrderStatus === 'disputed'
  ) {
    return TransactionStatus.DISPUTED;
  }

  return TransactionStatus.UNKNOWN;
}

export function mapPagarmeDocumentType(documentType?: string): CanonicalDocumentType {
  const normalized = normalizeString(documentType);

  if (normalized === 'cpf') {
    return DocumentType.CPF;
  }

  if (normalized === 'cnpj') {
    return DocumentType.CNPJ;
  }

  throw new ValidationError({
    message: 'Unsupported Pagar.me document type',
    code: ErrorCode.INVALID_DOCUMENT_TYPE,
    details: {
      provider: PspType.PAGARME,
      documentType,
    },
  });
}

export function isPagarmeCreditCardCharge(charge?: PagarmeChargeResponse): boolean {
  if (!charge) {
    return false;
  }

  const paymentMethod = normalizeString(charge.payment_method);
  const transactionType = normalizeString(charge.last_transaction?.transaction_type);

  return paymentMethod === 'credit_card' && transactionType === 'credit_card';
}

export function getPagarmeEligibleCreditCardCharge(
  order: PagarmeOrderResponse,
): PagarmeChargeResponse {
  const charge = order.charges?.find((current) => isPagarmeCreditCardCharge(current));

  if (!charge) {
    throw new DomainError({
      message: 'Pagar.me order is outside credit card scope',
      code: ErrorCode.DOMAIN_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId: order.id,
      },
    });
  }

  return charge;
}

export function ensurePagarmeOrderMinimumData(order: PagarmeOrderResponse): void {
  if (!order.id?.trim()) {
    throw new ValidationError({
      message: 'Pagar.me order id is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        field: 'id',
      },
    });
  }

  if (!order.currency?.trim()) {
    throw new ValidationError({
      message: 'Pagar.me order currency is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId: order.id,
        field: 'currency',
      },
    });
  }

  if (!order.created_at?.trim()) {
    throw new ValidationError({
      message: 'Pagar.me order created_at is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId: order.id,
        field: 'created_at',
      },
    });
  }

  if (!order.updated_at?.trim()) {
    throw new ValidationError({
      message: 'Pagar.me order updated_at is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId: order.id,
        field: 'updated_at',
      },
    });
  }
}

export function ensurePagarmeCustomerMinimumData(
  customer: PagarmeCustomerResponse | undefined,
  orderId?: string,
): asserts customer is Required<
  Pick<PagarmeCustomerResponse, 'name' | 'email' | 'document' | 'document_type'>
> &
  PagarmeCustomerResponse {
  if (
    !customer?.name?.trim() ||
    !customer.email?.trim() ||
    !customer.document?.trim() ||
    !customer.document_type?.trim()
  ) {
    throw new DomainError({
      message: 'Pagar.me customer has incomplete payer data',
      code: ErrorCode.INCOMPLETE_PAYER_DATA,
      details: {
        provider: PspType.PAGARME,
        orderId,
      },
    });
  }
}

export function ensurePagarmeInstallmentsMinimumData(order: PagarmeOrderResponse): number {
  const eligibleCharge = getPagarmeEligibleCreditCardCharge(order);
  const installments = eligibleCharge.last_transaction?.installments;

  if (typeof installments !== 'number' || !Number.isInteger(installments) || installments <= 0) {
    throw new DomainError({
      message: 'Pagar.me order has incomplete installments data',
      code: ErrorCode.INCOMPLETE_INSTALLMENTS,
      details: {
        provider: PspType.PAGARME,
        orderId: order.id,
      },
    });
  }

  return installments;
}

export function parsePagarmeDate(value: string, field: string, orderId?: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError({
      message: 'Invalid Pagar.me date field',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId,
        field,
        value,
      },
    });
  }

  return parsed;
}

export function normalizePagarmeAmountInCents(
  value: number | undefined,
  field: string,
  orderId?: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError({
      message: 'Invalid Pagar.me monetary field',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.PAGARME,
        orderId,
        field,
        value,
      },
    });
  }

  return value;
}

export function calculatePagarmeFeesInCents(
  grossAmountInCents: number,
  netAmountInCents: number,
): number {
  const fees = grossAmountInCents - netAmountInCents;

  return fees >= 0 ? fees : 0;
}

export function normalizeString(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}
