import { DomainError, ValidationError } from '../../../../shared/application/errors';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import { DocumentHashService } from '../../../../shared/infrastructure/security/DocumentHashService';
import {
  CanonicalInstallmentStatus,
  type InstallmentEntity,
  type PayerSnapshot,
  type TransactionEntity,
} from '../../../../transactions/domain/entities';
import {
  createDocumentHashValueObject,
  createExternalTransactionReferenceValueObject,
  createMoneyValueObject,
} from '../../../../transactions/domain/value-objects';
import {
  buildMercadoPagoPayerName,
  convertMercadoPagoDecimalToCents,
  ensureMercadoPagoCreditCardPaymentScope,
  ensureMercadoPagoInstallmentsMinimumData,
  ensureMercadoPagoPayerMinimumData,
  ensureMercadoPagoPaymentMinimumData,
  mapMercadoPagoDocumentType,
  mapMercadoPagoTransactionStatus,
  parseMercadoPagoDate,
  sumMercadoPagoFeesInCents,
} from './mercadopago.mappers';
import type { MercadoPagoPaymentResponse } from './mercadopago.schemas';

export class MercadoPagoTransactionAdapter {
  public adapt(payment: MercadoPagoPaymentResponse): TransactionEntity {
    ensureMercadoPagoPaymentMinimumData(payment);
    ensureMercadoPagoCreditCardPaymentScope(payment);
    ensureMercadoPagoPayerMinimumData(payment.payer, payment.id);

    const installmentCount = ensureMercadoPagoInstallmentsMinimumData(payment);
    const originalAmountInCents = convertMercadoPagoDecimalToCents(
      payment.transaction_amount,
      'transaction_amount',
      payment.id,
    );

    const netAmountInCents = convertMercadoPagoDecimalToCents(
      payment.net_received_amount,
      'net_received_amount',
      payment.id,
    );

    const feesInCents = this.resolveFeesInCents(payment);
    const createdAt = parseMercadoPagoDate(payment.date_created!, 'date_created', payment.id);

    const updatedAt = parseMercadoPagoDate(
      payment.date_last_updated!,
      'date_last_updated',
      payment.id,
    );

    const transactionStatus = mapMercadoPagoTransactionStatus(
      payment.status,
      payment.status_detail,
    );

    const payerSnapshot = this.buildPayerSnapshot(payment);
    const installments = this.buildInstallments({
      payment,
      installmentCount,
      originalAmountInCents,
      feesInCents,
      transactionStatus,
    });

    return {
      id: 0,
      externalReference: createExternalTransactionReferenceValueObject({
        psp: 'mercadopago',
        externalId: `${payment.id}`,
      }),
      paymentMethod: 'credit_card',
      status: transactionStatus,
      originalAmount: createMoneyValueObject({
        amountInCents: originalAmountInCents,
      }),
      netAmount: createMoneyValueObject({
        amountInCents: netAmountInCents,
      }),
      fees: createMoneyValueObject({
        amountInCents: feesInCents,
      }),
      installmentCount,
      currency: payment.currency_id!,
      createdAt,
      updatedAt,
      payerSnapshot,
      installments,
      metadata: {
        canonicalizedAt: new Date(),
        sourceCapturedAt: updatedAt,
      },
    };
  }

  private buildPayerSnapshot(payment: MercadoPagoPaymentResponse): PayerSnapshot {
    const payer = payment.payer!;
    const rawDocument = payer.identification!.number!;
    const normalizedDocument = DocumentHashService.normalize(rawDocument);

    if (!normalizedDocument) {
      throw new DomainError({
        message: 'Mercado Pago payer has invalid document data',
        code: ErrorCode.INCOMPLETE_PAYER_DATA,
        details: {
          provider: 'mercadopago',
          paymentId: payment.id,
          field: 'payer.identification.number',
        },
      });
    }

    return {
      externalId: payer.id !== undefined && payer.id !== null ? `${payer.id}` : undefined,
      name: buildMercadoPagoPayerName(payer),
      email: payer.email!.trim(),
      documentHash: createDocumentHashValueObject(DocumentHashService.hash(normalizedDocument)),
      documentType: mapMercadoPagoDocumentType(payer.identification!.type),
    };
  }

  private buildInstallments(params: {
    payment: MercadoPagoPaymentResponse;
    installmentCount: number;
    originalAmountInCents: number;
    feesInCents: number;
    transactionStatus: TransactionEntity['status'];
  }): InstallmentEntity[] {
    const baseAmount = Math.floor(params.originalAmountInCents / params.installmentCount);
    const remainder = params.originalAmountInCents % params.installmentCount;

    const baseFee = Math.floor(params.feesInCents / params.installmentCount);
    const feeRemainder = params.feesInCents % params.installmentCount;

    const installments: InstallmentEntity[] = [];

    for (
      let installmentNumber = 1;
      installmentNumber <= params.installmentCount;
      installmentNumber += 1
    ) {
      const amountInCents = baseAmount + (installmentNumber <= remainder ? 1 : 0);

      const feeInCents = baseFee + (installmentNumber <= feeRemainder ? 1 : 0);

      installments.push({
        id: 0,
        transactionId: 0,
        installmentNumber,
        amount: createMoneyValueObject({
          amountInCents,
        }),
        fees: createMoneyValueObject({
          amountInCents: feeInCents,
        }),
        status: this.mapInstallmentStatus(params.transactionStatus),
      });
    }

    if (installments.length !== params.installmentCount) {
      throw new ValidationError({
        message: 'Failed to compose Mercado Pago installments',
        code: ErrorCode.INCOMPLETE_INSTALLMENTS,
        details: {
          provider: 'mercadopago',
          paymentId: params.payment.id,
        },
      });
    }

    return installments;
  }

  private mapInstallmentStatus(
    transactionStatus: TransactionEntity['status'],
  ): InstallmentEntity['status'] {
    switch (transactionStatus) {
      case 'paid':
        return CanonicalInstallmentStatus.PAID;
      case 'pending':
        return CanonicalInstallmentStatus.PENDING;
      case 'canceled':
        return CanonicalInstallmentStatus.CANCELED;
      case 'failed':
        return CanonicalInstallmentStatus.FAILED;
      default:
        return CanonicalInstallmentStatus.UNKNOWN;
    }
  }

  private resolveFeesInCents(payment: MercadoPagoPaymentResponse): number {
    const feeDetailsSum = sumMercadoPagoFeesInCents(payment.fee_details, payment.id);

    if (feeDetailsSum > 0) {
      return feeDetailsSum;
    }

    const grossAmountInCents = convertMercadoPagoDecimalToCents(
      payment.transaction_amount,
      'transaction_amount',
      payment.id,
    );

    const netAmountInCents = convertMercadoPagoDecimalToCents(
      payment.net_received_amount,
      'net_received_amount',
      payment.id,
    );

    const diff = grossAmountInCents - netAmountInCents;

    return diff >= 0 ? diff : 0;
  }
}
