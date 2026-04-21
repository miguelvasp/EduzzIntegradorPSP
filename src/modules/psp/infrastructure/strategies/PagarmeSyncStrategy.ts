import { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../../transactions/domain/entities';
import type {
  PspSyncListPageParams,
  PspSyncListPageResult,
  PspSyncStrategy,
} from '../../domain/contracts/PspSyncStrategy';
import type { PagarmeOrderResponse } from '../clients/pagarme/pagarme.schemas';
import { PagarmeHttpClient } from '../clients/pagarme/PagarmeHttpClient';
import { PagarmeTransactionAdapter } from '../clients/pagarme/PagarmeTransactionAdapter';

export class PagarmeSyncStrategy implements PspSyncStrategy<PagarmeOrderResponse> {
  public constructor(
    private readonly httpClient: PagarmeHttpClient,
    private readonly adapter: PagarmeTransactionAdapter,
  ) {}

  public getPsp(): PspType {
    return PspType.PAGARME;
  }

  public async listPage(
    params: PspSyncListPageParams,
  ): Promise<PspSyncListPageResult<PagarmeOrderResponse>> {
    const page = params.page ?? 1;
    const size = params.size ?? 20;

    const response = await this.httpClient.listOrders({
      page,
      size,
    });

    return {
      items: response.data ?? [],
      pagination: {
        page,
        size,
        total: response.paging?.total,
        hasMore: response.paging?.has_more ?? false,
      },
    };
  }

  public async getById(externalId: string): Promise<PagarmeOrderResponse> {
    return this.httpClient.getOrderById(externalId);
  }

  public adapt(item: PagarmeOrderResponse): TransactionEntity {
    return this.adapter.adapt(item);
  }
}
