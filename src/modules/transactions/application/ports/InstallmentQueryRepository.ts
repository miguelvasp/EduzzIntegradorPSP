import type { GetInstallmentByIdQuery } from '../dto/GetInstallmentByIdQuery';
import type { InstallmentDetailDto } from '../dto/InstallmentDetailDto';
import type { ListTransactionInstallmentsQuery } from '../dto/ListTransactionInstallmentsQuery';
import type { TransactionInstallmentDto } from '../dto/TransactionInstallmentDto';

export interface InstallmentQueryRepository {
  listByTransactionId(
    query: ListTransactionInstallmentsQuery,
  ): Promise<TransactionInstallmentDto[] | null>;

  getById(query: GetInstallmentByIdQuery): Promise<InstallmentDetailDto | null>;
}
