import type { InstallmentDetailDto } from '../../../application/dto/InstallmentDetailDto';

export class InstallmentDetailHttpMapper {
  public map(detail: InstallmentDetailDto): InstallmentDetailDto {
    return {
      id: detail.id,
      transactionId: detail.transactionId,
      installmentNumber: detail.installmentNumber,
      amount: detail.amount,
      fees: detail.fees,
      status: detail.status,
      dueAt: detail.dueAt,
      paidAt: detail.paidAt,
      updatedAt: detail.updatedAt,
    };
  }
}
