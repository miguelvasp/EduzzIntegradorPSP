export type CacheQueryType =
  | 'transactions_list'
  | 'transaction_detail'
  | 'transaction_installments'
  | 'installment_detail'
  | 'transaction_payer';

export type CachePolicyResolverConfig = {
  enabled: boolean;
  defaultTtlSeconds: number;
  ttlByQueryType?: Partial<Record<CacheQueryType, number>>;
};

export class CachePolicyResolver {
  public constructor(private readonly config: CachePolicyResolverConfig) {}

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getTtlSeconds(queryType: CacheQueryType): number {
    return this.config.ttlByQueryType?.[queryType] ?? this.config.defaultTtlSeconds;
  }
}
