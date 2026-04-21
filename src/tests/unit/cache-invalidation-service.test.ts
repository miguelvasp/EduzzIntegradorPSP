import { describe, expect, it, vi } from 'vitest';
import { CacheInvalidationPolicy } from '../../modules/shared/infrastructure/cache/CacheInvalidationPolicy';
import { CacheInvalidationService } from '../../modules/shared/infrastructure/cache/CacheInvalidationService';
import { CacheKeyBuilder } from '../../modules/shared/infrastructure/cache/CacheKeyBuilder';
import { CacheNamespaceResolver } from '../../modules/shared/infrastructure/cache/CacheNamespaceResolver';
import type { CacheService } from '../../modules/shared/infrastructure/cache/CacheService';

describe('CacheInvalidationService', () => {
  it('deve invalidar chaves corretas para update de parcelas', async () => {
    const cacheService: CacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const service = new CacheInvalidationService(
      cacheService,
      new CacheInvalidationPolicy(),
      new CacheNamespaceResolver(new CacheKeyBuilder()),
    );

    await service.invalidate({
      transactionId: 10,
      syncRunId: 'sync-1',
      changeType: 'installments_updated',
      affectedInstallmentIds: [100, 101],
      materialChange: true,
    });

    expect(cacheService.delete).toHaveBeenCalledTimes(4);
    expect(cacheService.delete).toHaveBeenCalledWith('transactions:detail|transactionId=10');
    expect(cacheService.delete).toHaveBeenCalledWith('transactions:installments|transactionId=10');
    expect(cacheService.delete).toHaveBeenCalledWith(
      'transactions:installment-detail|installmentId=100|transactionId=10',
    );
    expect(cacheService.delete).toHaveBeenCalledWith('transactions:detail|transactionId=10');
    expect(cacheService.delete).toHaveBeenCalledWith('transactions:installments|transactionId=10');
    expect(cacheService.delete).toHaveBeenCalledWith(
      'transactions:installment-detail|installmentId=100|transactionId=10',
    );
    expect(cacheService.delete).toHaveBeenCalledWith(
      'transactions:installment-detail|installmentId=101|transactionId=10',
    );
  });

  it('nao deve invalidar nada em no_change', async () => {
    const cacheService: CacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    const service = new CacheInvalidationService(
      cacheService,
      new CacheInvalidationPolicy(),
      new CacheNamespaceResolver(new CacheKeyBuilder()),
    );

    await service.invalidate({
      transactionId: 10,
      changeType: 'no_change',
      materialChange: false,
    });

    expect(cacheService.delete).not.toHaveBeenCalled();
  });

  it('erro de delete nao deve explodir o serviço', async () => {
    const cacheService: CacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi
        .fn()
        .mockRejectedValueOnce(new Error('delete failed'))
        .mockResolvedValue(undefined),
    };

    const service = new CacheInvalidationService(
      cacheService,
      new CacheInvalidationPolicy(),
      new CacheNamespaceResolver(new CacheKeyBuilder()),
    );

    await expect(
      service.invalidate({
        transactionId: 10,
        changeType: 'payer_updated',
        payerChanged: true,
        materialChange: true,
      }),
    ).resolves.toBeUndefined();
  });
});
