import type { InstallmentDetailDto } from '../dto/InstallmentDetailDto';
import type { ListTransactionInstallmentsQuery } from '../dto/ListTransactionInstallmentsQuery';
import type { TransactionInstallmentDto } from '../dto/TransactionInstallmentDto';

export type InstallmentDetailQuery = {
  installmentId: number;
  transactionId?: number;
};

export interface InstallmentQueryRepository {
  listByTransactionId(
    query: ListTransactionInstallmentsQuery,
  ): Promise<TransactionInstallmentDto[] | null>;

  getById(query: InstallmentDetailQuery): Promise<InstallmentDetailDto | null>;
}
