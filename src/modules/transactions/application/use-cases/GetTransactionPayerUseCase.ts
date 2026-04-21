import { NotFoundError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { GetTransactionPayerQueryInput } from '../dto/GetTransactionPayerQuery';
import { normalizeGetTransactionPayerQuery } from '../dto/GetTransactionPayerQuery';
import type { TransactionPayerDto } from '../dto/TransactionPayerDto';
import type { TransactionQueryRepository } from '../ports/TransactionQueryRepository';

export class GetTransactionPayerUseCase {
  public constructor(private readonly transactionQueryRepository: TransactionQueryRepository) {}

  public async execute(input: GetTransactionPayerQueryInput): Promise<TransactionPayerDto> {
    const query = normalizeGetTransactionPayerQuery(input);
    const payer = await this.transactionQueryRepository.getPayerByTransactionId(query);

    if (!payer) {
      throw new NotFoundError({
        message: 'Transaction payer not found',
        code: ErrorCode.RESOURCE_NOT_FOUND,
        details: {
          transactionId: query.transactionId,
        },
      });
    }

    return payer;
  }
}
