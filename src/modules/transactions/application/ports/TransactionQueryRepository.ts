import type { GetTransactionByIdQuery } from '../dto/GetTransactionByIdQuery';
import type { GetTransactionPayerQuery } from '../dto/GetTransactionPayerQuery';
import type { ListTransactionsQuery } from '../dto/ListTransactionsQuery';
import type { TransactionDetailDto } from '../dto/TransactionDetailDto';
import type { TransactionListItemDto } from '../dto/TransactionListItemDto';
import type { TransactionPayerDto } from '../dto/TransactionPayerDto';

export interface TransactionQueryRepository {
  list(query: ListTransactionsQuery): Promise<{
    items: TransactionListItemDto[];
    total: number;
  }>;

  getById(query: GetTransactionByIdQuery): Promise<TransactionDetailDto | null>;

  getPayerByTransactionId(query: GetTransactionPayerQuery): Promise<TransactionPayerDto | null>;
}
