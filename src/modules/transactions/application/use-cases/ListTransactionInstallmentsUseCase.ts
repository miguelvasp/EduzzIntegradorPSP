import { NotFoundError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { ListTransactionInstallmentsQueryInput } from '../dto/ListTransactionInstallmentsQuery';
import { normalizeListTransactionInstallmentsQuery } from '../dto/ListTransactionInstallmentsQuery';
import type { TransactionInstallmentDto } from '../dto/TransactionInstallmentDto';
import type { InstallmentQueryRepository } from '../ports/InstallmentQueryRepository';

export class ListTransactionInstallmentsUseCase {
  public constructor(private readonly installmentQueryRepository: InstallmentQueryRepository) {}

  public async execute(
    input: ListTransactionInstallmentsQueryInput,
  ): Promise<TransactionInstallmentDto[]> {
    const query = normalizeListTransactionInstallmentsQuery(input);
    const installments = await this.installmentQueryRepository.listByTransactionId(query);

    if (!installments) {
      throw new NotFoundError({
        message: 'Transaction not found',
        code: ErrorCode.RESOURCE_NOT_FOUND,
        details: {
          transactionId: query.transactionId,
        },
      });
    }

    return [...installments].sort(
      (left, right) => left.installmentNumber - right.installmentNumber,
    );
  }
}
