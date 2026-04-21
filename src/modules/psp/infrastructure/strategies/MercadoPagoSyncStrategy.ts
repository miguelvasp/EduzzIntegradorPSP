import { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../../transactions/domain/entities';
import type {
  PspSyncListPageParams,
  PspSyncListPageResult,
  PspSyncStrategy,
} from '../../domain/contracts/PspSyncStrategy';
import type { MercadoPagoPaymentResponse } from '../clients/mercadopago/mercadopago.schemas';
import { MercadoPagoHttpClient } from '../clients/mercadopago/MercadoPagoHttpClient';
import { MercadoPagoTransactionAdapter } from '../clients/mercadopago/MercadoPagoTransactionAdapter';

export class MercadoPagoSyncStrategy implements PspSyncStrategy<MercadoPagoPaymentResponse> {
  public constructor(
    private readonly httpClient: MercadoPagoHttpClient,
    private readonly adapter: MercadoPagoTransactionAdapter,
  ) {}

  public getPsp(): PspType {
    return PspType.MERCADO_PAGO;
  }

  public async listPage(
    params: PspSyncListPageParams,
  ): Promise<PspSyncListPageResult<MercadoPagoPaymentResponse>> {
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;

    const response = await this.httpClient.searchPayments({
      offset,
      limit,
    });

    const total = response.paging?.total;
    const currentOffset = response.paging?.offset ?? offset;
    const currentLimit = response.paging?.limit ?? limit;
    const itemCount = response.results?.length ?? 0;
    const hasMore =
      typeof total === 'number' ? currentOffset + itemCount < total : itemCount >= currentLimit;

    return {
      items: response.results ?? [],
      pagination: {
        offset: currentOffset,
        limit: currentLimit,
        total,
        hasMore,
      },
    };
  }

  public async getById(externalId: string): Promise<MercadoPagoPaymentResponse> {
    return this.httpClient.getPaymentById(externalId);
  }

  public adapt(item: MercadoPagoPaymentResponse): TransactionEntity {
    return this.adapter.adapt(item);
  }
}
