import { describe, expect, it } from 'vitest';
import { CachePolicyResolver } from '../../modules/shared/infrastructure/cache/CachePolicyResolver';

describe('CachePolicyResolver', () => {
  it('deve respeitar flag global de habilitação', () => {
    const enabledResolver = new CachePolicyResolver({
      enabled: true,
      defaultTtlSeconds: 30,
    });

    const disabledResolver = new CachePolicyResolver({
      enabled: false,
      defaultTtlSeconds: 30,
    });

    expect(enabledResolver.isEnabled()).toBe(true);
    expect(disabledResolver.isEnabled()).toBe(false);
  });

  it('deve retornar TTL específico por tipo', () => {
    const resolver = new CachePolicyResolver({
      enabled: true,
      defaultTtlSeconds: 30,
      ttlByQueryType: {
        transactions_list: 15,
        transaction_detail: 60,
      },
    });

    expect(resolver.getTtlSeconds('transactions_list')).toBe(15);
    expect(resolver.getTtlSeconds('transaction_detail')).toBe(60);
  });

  it('deve usar TTL default quando não houver override', () => {
    const resolver = new CachePolicyResolver({
      enabled: true,
      defaultTtlSeconds: 30,
      ttlByQueryType: {
        transactions_list: 15,
      },
    });

    expect(resolver.getTtlSeconds('transaction_payer')).toBe(30);
  });
});
