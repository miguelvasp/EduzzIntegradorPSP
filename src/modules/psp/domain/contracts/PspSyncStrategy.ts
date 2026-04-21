import { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../../transactions/domain/entities';

export type PspSyncListPageParams = {
  page?: number;
  size?: number;
  offset?: number;
  limit?: number;
};

export type PspSyncListPageResult<TExternalItem> = {
  items: TExternalItem[];
  pagination: {
    page?: number;
    size?: number;
    offset?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
};

export interface PspSyncStrategy<TExternalItem> {
  getPsp(): PspType;
  listPage(params: PspSyncListPageParams): Promise<PspSyncListPageResult<TExternalItem>>;
  getById(externalId: string): Promise<TExternalItem>;
  adapt(item: TExternalItem): TransactionEntity;
}
