import { describe, expect, it, vi } from 'vitest';
import { CachedQueryExecutor } from '../../modules/shared/infrastructure/cache/CachedQueryExecutor';
import { CachePolicyResolver } from '../../modules/shared/infrastructure/cache/CachePolicyResolver';

describe('CachedQueryExecutor', () => {
  it('deve retornar valor do cache em caso de hit', async () => {
    const cacheService = {
      get: vi.fn().mockResolvedValue({ data: [1] }),
      set: vi.fn(),
      delete: vi.fn(),
    };

    const executor = new CachedQueryExecutor(
      cacheService,
      new CachePolicyResolver({
        enabled: true,
        defaultTtlSeconds: 30,
      }),
    );

    const loader = vi.fn();

    const result = await executor.execute({
      cacheKey: 'k1',
      queryType: 'transactions_list',
      loader,
    });

    expect(cacheService.get).toHaveBeenCalledWith('k1');
    expect(loader).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [1] });
  });

  it('deve executar loader e salvar no cache em caso de miss', async () => {
    const cacheService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    const executor = new CachedQueryExecutor(
      cacheService,
      new CachePolicyResolver({
        enabled: true,
        defaultTtlSeconds: 45,
      }),
    );

    const loader = vi.fn().mockResolvedValue({ data: [1, 2] });

    const result = await executor.execute({
      cacheKey: 'k2',
      queryType: 'transaction_detail',
      loader,
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(cacheService.set).toHaveBeenCalledWith('k2', { data: [1, 2] }, 45);
    expect(result).toEqual({ data: [1, 2] });
  });

  it('deve fazer bypass quando cache estiver desabilitado', async () => {
    const cacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    const executor = new CachedQueryExecutor(
      cacheService,
      new CachePolicyResolver({
        enabled: false,
        defaultTtlSeconds: 30,
      }),
    );

    const loader = vi.fn().mockResolvedValue({ data: [] });

    const result = await executor.execute({
      cacheKey: 'k3',
      queryType: 'transaction_payer',
      loader,
    });

    expect(cacheService.get).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [] });
  });

  it('erro de leitura do cache não deve quebrar a query principal', async () => {
    const cacheService = {
      get: vi.fn().mockRejectedValue(new Error('cache read failed')),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    const executor = new CachedQueryExecutor(
      cacheService,
      new CachePolicyResolver({
        enabled: true,
        defaultTtlSeconds: 30,
      }),
    );

    const loader = vi.fn().mockResolvedValue({ data: ['ok'] });

    const result = await executor.execute({
      cacheKey: 'k4',
      queryType: 'transaction_detail',
      loader,
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: ['ok'] });
  });

  it('erro de escrita do cache não deve quebrar a query principal', async () => {
    const cacheService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockRejectedValue(new Error('cache write failed')),
      delete: vi.fn(),
    };

    const executor = new CachedQueryExecutor(
      cacheService,
      new CachePolicyResolver({
        enabled: true,
        defaultTtlSeconds: 30,
      }),
    );

    const loader = vi.fn().mockResolvedValue({ data: ['ok'] });

    const result = await executor.execute({
      cacheKey: 'k5',
      queryType: 'transaction_installments',
      loader,
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: ['ok'] });
  });
});
