import type { TransactionDetailDto } from '../../../application/dto/TransactionDetailDto';

export class TransactionDetailHttpMapper {
  public map(detail: TransactionDetailDto): TransactionDetailDto {
    return {
      id: detail.id,
      externalId: detail.externalId,
      psp: detail.psp,
      status: detail.status,
      originalAmount: detail.originalAmount,
      netAmount: detail.netAmount,
      fees: detail.fees,
      installmentCount: detail.installmentCount,
      currency: detail.currency,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      payer: detail.payer
        ? {
            id: detail.payer.id,
            externalId: detail.payer.externalId,
            name: detail.payer.name,
            email: detail.payer.email,
            documentType: detail.payer.documentType,
            hasDocument: detail.payer.hasDocument,
          }
        : undefined,
      installments: detail.installments.map((installment) => ({
        id: installment.id,
        installmentNumber: installment.installmentNumber,
        amount: installment.amount,
        fees: installment.fees,
        status: installment.status,
        paidAt: installment.paidAt,
        updatedAt: installment.updatedAt,
      })),
    };
  }
}
