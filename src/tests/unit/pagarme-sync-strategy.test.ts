import { describe, expect, it, vi } from 'vitest';
import type { PagarmeOrderResponse } from '../../modules/psp/infrastructure/clients/pagarme/pagarme.schemas';
import { PagarmeSyncStrategy } from '../../modules/psp/infrastructure/strategies/PagarmeSyncStrategy';
import { PspType } from '../../modules/shared/domain/enums/pspType';

describe('PagarmeSyncStrategy', () => {
  it('deve retornar o PSP correto', () => {
    const httpClient = {
      listOrders: vi.fn(),
      getOrderById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new PagarmeSyncStrategy(httpClient as never, adapter as never);

    expect(strategy.getPsp()).toBe(PspType.PAGARME);
  });

  it('deve listar página usando page e size', async () => {
    const httpClient = {
      listOrders: vi.fn().mockResolvedValue({
        data: [{ id: 'or_1' }],
        paging: {
          total: 1,
          has_more: false,
        },
      }),
      getOrderById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new PagarmeSyncStrategy(httpClient as never, adapter as never);

    const result = await strategy.listPage({
      page: 2,
      size: 50,
    });

    expect(httpClient.listOrders).toHaveBeenCalledWith({
      page: 2,
      size: 50,
    });

    expect(result).toEqual({
      items: [{ id: 'or_1' }],
      pagination: {
        page: 2,
        size: 50,
        total: 1,
        hasMore: false,
      },
    });
  });

  it('deve buscar detalhe por id', async () => {
    const order: PagarmeOrderResponse = { id: 'or_123' };

    const httpClient = {
      listOrders: vi.fn(),
      getOrderById: vi.fn().mockResolvedValue(order),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new PagarmeSyncStrategy(httpClient as never, adapter as never);

    const result = await strategy.getById('or_123');

    expect(httpClient.getOrderById).toHaveBeenCalledWith('or_123');
    expect(result).toBe(order);
  });

  it('deve adaptar item usando adapter do Pagar.me', () => {
    const adapted = { id: 1 };

    const httpClient = {
      listOrders: vi.fn(),
      getOrderById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn().mockReturnValue(adapted),
    };

    const strategy = new PagarmeSyncStrategy(httpClient as never, adapter as never);

    const item = { id: 'or_123' } as PagarmeOrderResponse;
    const result = strategy.adapt(item);

    expect(adapter.adapt).toHaveBeenCalledWith(item);
    expect(result).toBe(adapted);
  });
});
