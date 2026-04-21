import type { ListTransactionsQueryInput } from '../dto/ListTransactionsQuery';
import { normalizeListTransactionsQuery } from '../dto/ListTransactionsQuery';
import type { PaginatedTransactionsResponse } from '../dto/PaginatedTransactionsResponse';
import type { TransactionQueryRepository } from '../ports/TransactionQueryRepository';

export class ListTransactionsUseCase {
  public constructor(private readonly transactionQueryRepository: TransactionQueryRepository) {}

  public async execute(input: ListTransactionsQueryInput): Promise<PaginatedTransactionsResponse> {
    const query = normalizeListTransactionsQuery(input);
    const result = await this.transactionQueryRepository.list(query);
    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

    return {
      items: result.items,
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }
}
