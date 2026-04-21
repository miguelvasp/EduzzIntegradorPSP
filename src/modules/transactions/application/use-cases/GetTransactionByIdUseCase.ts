import { NotFoundError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { GetTransactionByIdQueryInput } from '../dto/GetTransactionByIdQuery';
import { normalizeGetTransactionByIdQuery } from '../dto/GetTransactionByIdQuery';
import type { TransactionDetailDto } from '../dto/TransactionDetailDto';
import type { TransactionQueryRepository } from '../ports/TransactionQueryRepository';

export class GetTransactionByIdUseCase {
  public constructor(private readonly transactionQueryRepository: TransactionQueryRepository) {}

  public async execute(input: GetTransactionByIdQueryInput): Promise<TransactionDetailDto> {
    const query = normalizeGetTransactionByIdQuery(input);
    const transaction = await this.transactionQueryRepository.getById(query);

    if (!transaction) {
      throw new NotFoundError({
        message: 'Transaction not found',
        code: ErrorCode.RESOURCE_NOT_FOUND,
        details: {
          transactionId: query.id,
        },
      });
    }

    return transaction;
  }
}
