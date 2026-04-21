import { DomainError, ValidationError } from '../../../../shared/application/errors';
import { PspType } from '../../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import {
  CanonicalDocumentType,
  CanonicalTransactionStatus,
} from '../../../../transactions/domain/entities';
import type {
  MercadoPagoFeeDetailResponse,
  MercadoPagoPayerResponse,
  MercadoPagoPaymentResponse,
} from './mercadopago.schemas';

export function normalizeMercadoPagoString(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

export function mapMercadoPagoTransactionStatus(
  status?: string,
  statusDetail?: string,
): CanonicalTransactionStatus {
  const normalizedStatus = normalizeMercadoPagoString(status);
  const normalizedStatusDetail = normalizeMercadoPagoString(statusDetail);

  if (normalizedStatus === 'approved' && normalizedStatusDetail === 'accredited') {
    return CanonicalTransactionStatus.PAID;
  }

  if (normalizedStatus === 'approved') {
    return CanonicalTransactionStatus.PAID;
  }

  if (normalizedStatus === 'pending' || normalizedStatus === 'in_process') {
    return CanonicalTransactionStatus.PENDING;
  }

  if (normalizedStatus === 'rejected') {
    return CanonicalTransactionStatus.FAILED;
  }

  if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
    return CanonicalTransactionStatus.CANCELED;
  }

  if (normalizedStatus === 'refunded') {
    return CanonicalTransactionStatus.REFUNDED;
  }

  if (normalizedStatus === 'charged_back') {
    return CanonicalTransactionStatus.DISPUTED;
  }

  return CanonicalTransactionStatus.UNKNOWN;
}

export function mapMercadoPagoDocumentType(documentType?: string): CanonicalDocumentType {
  const normalized = normalizeMercadoPagoString(documentType);

  if (normalized === 'cpf') {
    return CanonicalDocumentType.CPF;
  }

  if (normalized === 'cnpj') {
    return CanonicalDocumentType.CNPJ;
  }

  throw new ValidationError({
    message: 'Unsupported Mercado Pago document type',
    code: ErrorCode.INVALID_DOCUMENT_TYPE,
    details: {
      provider: PspType.MERCADO_PAGO,
      documentType,
    },
  });
}

export function ensureMercadoPagoCreditCardPaymentScope(payment: MercadoPagoPaymentResponse): void {
  if (normalizeMercadoPagoString(payment.payment_type_id) !== 'credit_card') {
    throw new DomainError({
      message: 'Mercado Pago payment is outside credit card scope',
      code: ErrorCode.DOMAIN_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId: payment.id,
        paymentTypeId: payment.payment_type_id,
      },
    });
  }
}

export function ensureMercadoPagoPaymentMinimumData(payment: MercadoPagoPaymentResponse): void {
  if (payment.id === undefined || payment.id === null || `${payment.id}`.trim() === '') {
    throw new ValidationError({
      message: 'Mercado Pago payment id is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        field: 'id',
      },
    });
  }

  if (!payment.currency_id?.trim()) {
    throw new ValidationError({
      message: 'Mercado Pago currency_id is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId: payment.id,
        field: 'currency_id',
      },
    });
  }

  if (!payment.date_created?.trim()) {
    throw new ValidationError({
      message: 'Mercado Pago date_created is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId: payment.id,
        field: 'date_created',
      },
    });
  }

  if (!payment.date_last_updated?.trim()) {
    throw new ValidationError({
      message: 'Mercado Pago date_last_updated is required',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId: payment.id,
        field: 'date_last_updated',
      },
    });
  }
}

export function ensureMercadoPagoPayerMinimumData(
  payer: MercadoPagoPayerResponse | undefined,
  paymentId?: string | number,
): asserts payer is Required<Pick<MercadoPagoPayerResponse, 'email'>> &
  MercadoPagoPayerResponse & {
    identification: Required<{
      type: string;
      number: string;
    }>;
  } {
  const fullName = buildMercadoPagoPayerName(payer);

  if (
    !payer?.email?.trim() ||
    !fullName ||
    !payer.identification?.type?.trim() ||
    !payer.identification?.number?.trim()
  ) {
    throw new DomainError({
      message: 'Mercado Pago payer has incomplete payer data',
      code: ErrorCode.INCOMPLETE_PAYER_DATA,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId,
      },
    });
  }
}

export function ensureMercadoPagoInstallmentsMinimumData(
  payment: MercadoPagoPaymentResponse,
): number {
  const installments = payment.installments;

  if (typeof installments !== 'number' || !Number.isInteger(installments) || installments <= 0) {
    throw new DomainError({
      message: 'Mercado Pago payment has incomplete installments data',
      code: ErrorCode.INCOMPLETE_INSTALLMENTS,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId: payment.id,
      },
    });
  }

  return installments;
}

export function parseMercadoPagoDate(
  value: string,
  field: string,
  paymentId?: string | number,
): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError({
      message: 'Invalid Mercado Pago date field',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId,
        field,
        value,
      },
    });
  }

  return parsed;
}

export function convertMercadoPagoDecimalToCents(
  value: number | undefined,
  field: string,
  paymentId?: string | number,
): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new ValidationError({
      message: 'Invalid Mercado Pago monetary field',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        provider: PspType.MERCADO_PAGO,
        paymentId,
        field,
        value,
      },
    });
  }

  return Math.round(value * 100);
}

export function sumMercadoPagoFeesInCents(
  feeDetails: MercadoPagoFeeDetailResponse[] | undefined,
  paymentId?: string | number,
): number {
  if (!feeDetails?.length) {
    return 0;
  }

  return feeDetails.reduce((total, fee) => {
    return total + convertMercadoPagoDecimalToCents(fee.amount, 'fee_details[].amount', paymentId);
  }, 0);
}

export function buildMercadoPagoPayerName(payer?: MercadoPagoPayerResponse): string {
  const firstName = payer?.first_name?.trim() ?? '';
  const lastName = payer?.last_name?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName;
}
