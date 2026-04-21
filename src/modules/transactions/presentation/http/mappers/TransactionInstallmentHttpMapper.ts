import type { TransactionInstallmentDto } from '../../../application/dto/TransactionInstallmentDto';

export class TransactionInstallmentHttpMapper {
  public map(items: TransactionInstallmentDto[]): TransactionInstallmentDto[] {
    return items.map((item) => ({
      id: item.id,
      transactionId: item.transactionId,
      installmentNumber: item.installmentNumber,
      amount: item.amount,
      fees: item.fees,
      status: item.status,
      dueAt: item.dueAt,
      paidAt: item.paidAt,
      updatedAt: item.updatedAt,
    }));
  }
}
