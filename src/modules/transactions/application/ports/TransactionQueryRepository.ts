import type { ListTransactionsQuery } from '../dto/ListTransactionsQuery';
import type { TransactionListItemDto } from '../dto/TransactionListItemDto';

export interface TransactionQueryRepository {
  list(query: ListTransactionsQuery): Promise<{
    items: TransactionListItemDto[];
    total: number;
  }>;
}
