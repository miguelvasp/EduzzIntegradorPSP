import { DomainError, ValidationError } from '../../../../shared/application/errors';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import { DocumentHashService } from '../../../../shared/infrastructure/security/DocumentHashService';
import {
  type InstallmentEntity,
  type PayerSnapshot,
  type TransactionEntity,
  CanonicalInstallmentStatus,
} from '../../../../transactions/domain/entities';
import {
  createDocumentHashValueObject,
  createExternalTransactionReferenceValueObject,
  createMoneyValueObject,
} from '../../../../transactions/domain/value-objects';
import {
  calculatePagarmeFeesInCents,
  ensurePagarmeCustomerMinimumData,
  ensurePagarmeInstallmentsMinimumData,
  ensurePagarmeOrderMinimumData,
  getPagarmeEligibleCreditCardCharge,
  mapPagarmeDocumentType,
  mapPagarmeTransactionStatus,
  normalizePagarmeAmountInCents,
  parsePagarmeDate,
} from './pagarme.mappers';
import type { PagarmeOrderResponse } from './pagarme.schemas';

export class PagarmeTransactionAdapter {
  public adapt(order: PagarmeOrderResponse): TransactionEntity {
    ensurePagarmeOrderMinimumData(order);

    const charge = getPagarmeEligibleCreditCardCharge(order);
    const customer = order.customer;

    ensurePagarmeCustomerMinimumData(customer, order.id);

    const installmentsCount = ensurePagarmeInstallmentsMinimumData(order);

    const originalAmountInCents = normalizePagarmeAmountInCents(order.amount, 'amount', order.id);

    const netAmountInCents = normalizePagarmeAmountInCents(
      charge.paid_amount,
      'charges[].paid_amount',
      order.id,
    );

    const createdAt = parsePagarmeDate(order.created_at!, 'created_at', order.id);
    const updatedAt = parsePagarmeDate(order.updated_at!, 'updated_at', order.id);

    const payerSnapshot = this.buildPayerSnapshot(customer);
    const transactionStatus = mapPagarmeTransactionStatus(
      order.status,
      charge.status,
      charge.last_transaction?.status,
    );

    const installments = this.buildInstallments({
      order,
      installmentCount: installmentsCount,
      originalAmountInCents,
      feesInCents: calculatePagarmeFeesInCents(originalAmountInCents, netAmountInCents),
      transactionStatus,
    });

    return {
      id: 0,
      externalReference: createExternalTransactionReferenceValueObject({
        psp: 'pagarme',
        externalId: order.id!,
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
        amountInCents: calculatePagarmeFeesInCents(originalAmountInCents, netAmountInCents),
      }),
      installmentCount: installmentsCount,
      currency: order.currency!,
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

  private buildPayerSnapshot(
    customer: NonNullable<PagarmeOrderResponse['customer']>,
  ): PayerSnapshot {
    const normalizedDocument = DocumentHashService.normalize(customer.document!);

    if (!normalizedDocument) {
      throw new DomainError({
        message: 'Pagar.me customer has invalid document data',
        code: ErrorCode.INCOMPLETE_PAYER_DATA,
        details: {
          provider: 'pagarme',
          field: 'customer.document',
        },
      });
    }

    return {
      externalId: customer.id?.trim() || undefined,
      name: customer.name!.trim(),
      email: customer.email!.trim(),
      documentHash: createDocumentHashValueObject(DocumentHashService.hash(normalizedDocument)),
      documentType: mapPagarmeDocumentType(customer.document_type!),
    };
  }

  private buildInstallments(params: {
    order: PagarmeOrderResponse;
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
        message: 'Failed to compose Pagar.me installments',
        code: ErrorCode.INCOMPLETE_INSTALLMENTS,
        details: {
          provider: 'pagarme',
          orderId: params.order.id,
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
}
