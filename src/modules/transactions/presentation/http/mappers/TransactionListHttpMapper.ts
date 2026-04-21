import type { PaginatedTransactionsResponse } from '../../../application/dto/PaginatedTransactionsResponse';

export class TransactionListHttpMapper {
  public map(response: PaginatedTransactionsResponse): PaginatedTransactionsResponse {
    return {
      items: response.items.map((item) => ({
        id: item.id,
        externalId: item.externalId,
        psp: item.psp,
        status: item.status,
        originalAmount: item.originalAmount,
        netAmount: item.netAmount,
        fees: item.fees,
        installmentCount: item.installmentCount,
        currency: item.currency,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    };
  }
}
