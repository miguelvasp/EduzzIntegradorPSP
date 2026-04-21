import { describe, expect, it, vi } from 'vitest';
import type { MercadoPagoPaymentResponse } from '../../modules/psp/infrastructure/clients/mercadopago/mercadopago.schemas';
import { MercadoPagoSyncStrategy } from '../../modules/psp/infrastructure/strategies/MercadoPagoSyncStrategy';
import { PspType } from '../../modules/shared/domain/enums/pspType';

describe('MercadoPagoSyncStrategy', () => {
  it('deve retornar o PSP correto', () => {
    const httpClient = {
      searchPayments: vi.fn(),
      getPaymentById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new MercadoPagoSyncStrategy(httpClient as never, adapter as never);

    expect(strategy.getPsp()).toBe(PspType.MERCADO_PAGO);
  });

  it('deve listar página usando offset e limit', async () => {
    const httpClient = {
      searchPayments: vi.fn().mockResolvedValue({
        paging: {
          total: 10,
          limit: 20,
          offset: 0,
        },
        results: [{ id: 123 }],
      }),
      getPaymentById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new MercadoPagoSyncStrategy(httpClient as never, adapter as never);

    const result = await strategy.listPage({
      offset: 0,
      limit: 20,
    });

    expect(httpClient.searchPayments).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    });

    expect(result).toEqual({
      items: [{ id: 123 }],
      pagination: {
        offset: 0,
        limit: 20,
        total: 10,
        hasMore: true,
      },
    });
  });

  it('deve buscar detalhe por id', async () => {
    const payment: MercadoPagoPaymentResponse = { id: 123456789 };

    const httpClient = {
      searchPayments: vi.fn(),
      getPaymentById: vi.fn().mockResolvedValue(payment),
    };

    const adapter = {
      adapt: vi.fn(),
    };

    const strategy = new MercadoPagoSyncStrategy(httpClient as never, adapter as never);

    const result = await strategy.getById('123456789');

    expect(httpClient.getPaymentById).toHaveBeenCalledWith('123456789');
    expect(result).toBe(payment);
  });

  it('deve adaptar item usando adapter do Mercado Pago', () => {
    const adapted = { id: 1 };

    const httpClient = {
      searchPayments: vi.fn(),
      getPaymentById: vi.fn(),
    };

    const adapter = {
      adapt: vi.fn().mockReturnValue(adapted),
    };

    const strategy = new MercadoPagoSyncStrategy(httpClient as never, adapter as never);

    const item = { id: 123456789 } as MercadoPagoPaymentResponse;
    const result = strategy.adapt(item);

    expect(adapter.adapt).toHaveBeenCalledWith(item);
    expect(result).toBe(adapted);
  });
});
