import type { TransactionListItemDto } from './TransactionListItemDto';

export type PaginatedTransactionsResponse = {
  items: TransactionListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
