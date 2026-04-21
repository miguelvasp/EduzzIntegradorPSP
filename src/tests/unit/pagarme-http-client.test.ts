import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PagarmeHttpClient } from '../../modules/psp/infrastructure/clients/pagarme/PagarmeHttpClient';
import { IntegrationError, ValidationError } from '../../modules/shared/application/errors';

describe('PagarmeHttpClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.spyOn(global.Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function createClient() {
    return new PagarmeHttpClient({
      baseUrl: 'https://api.pagar.me',
      apiKey: 'test-api-key',
      timeoutMs: 500,
      retry: {
        maxAttempts: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 2,
        recoveryTimeoutMs: 1000,
      },
    });
  }

  it('deve falhar ao criar client sem baseUrl', () => {
    expect(
      () =>
        new PagarmeHttpClient({
          baseUrl: '',
          apiKey: 'test-api-key',
          timeoutMs: 500,
          retry: {
            maxAttempts: 2,
            baseDelayMs: 100,
            maxDelayMs: 1000,
            backoffFactor: 2,
            jitterFactor: 0,
          },
          circuitBreaker: {
            failureThreshold: 2,
            recoveryTimeoutMs: 1000,
          },
        }),
    ).toThrow(ValidationError);
  });

  it('deve falhar ao criar client sem apiKey', () => {
    expect(
      () =>
        new PagarmeHttpClient({
          baseUrl: 'https://api.pagar.me',
          apiKey: '',
          timeoutMs: 500,
          retry: {
            maxAttempts: 2,
            baseDelayMs: 100,
            maxDelayMs: 1000,
            backoffFactor: 2,
            jitterFactor: 0,
          },
          circuitBreaker: {
            failureThreshold: 2,
            recoveryTimeoutMs: 1000,
          },
        }),
    ).toThrow(ValidationError);
  });

  it('deve listar pedidos com parametros corretos', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'or_123',
            amount: 10000,
            currency: 'BRL',
          },
        ],
        paging: {
          total: 1,
          has_more: false,
        },
      }),
    } as Response);

    const result = await client.listOrders({
      page: 1,
      size: 20,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.pagar.me/core/v5/orders?page=1&size=20',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Basic ${Buffer.from('test-api-key:').toString('base64')}`,
        },
      },
    );

    expect(result).toEqual({
      data: [
        {
          id: 'or_123',
          amount: 10000,
          currency: 'BRL',
        },
      ],
      paging: {
        total: 1,
        has_more: false,
      },
    });
  });

  it('deve buscar detalhe do pedido por id', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'or_123',
        amount: 10000,
        currency: 'BRL',
      }),
    } as Response);

    const result = await client.getOrderById('or_123');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.pagar.me/core/v5/orders/or_123', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from('test-api-key:').toString('base64')}`,
      },
    });

    expect(result).toEqual({
      id: 'or_123',
      amount: 10000,
      currency: 'BRL',
    });
  });

  it('deve validar page invalida', async () => {
    const client = createClient();

    await expect(
      client.listOrders({
        page: 0,
        size: 20,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve validar size invalido', async () => {
    const client = createClient();

    await expect(
      client.listOrders({
        page: 1,
        size: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve validar orderId invalido', async () => {
    const client = createClient();

    await expect(client.getOrderById('')).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar quando contrato de listagem vier invalido', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {},
      }),
    } as Response);

    await expect(
      client.listOrders({
        page: 1,
        size: 20,
      }),
    ).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve falhar quando contrato de detalhe vier invalido', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => null,
    } as Response);

    await expect(client.getOrderById('or_123')).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve falhar com IntegrationError quando API retornar erro HTTP', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({
        message: 'internal failure',
      }),
      text: async () => '',
    } as unknown as Response);

    const execution = client.listOrders({
      page: 1,
      size: 20,
    });

    const rejection = expect(execution).rejects.toBeInstanceOf(IntegrationError);

    await vi.advanceTimersByTimeAsync(100);
    await rejection;
  });

  it('deve aplicar retry para falha transitória de fetch', async () => {
    const client = createClient();

    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [],
          paging: {
            total: 0,
            has_more: false,
          },
        }),
      } as Response);

    const execution = client.listOrders({
      page: 1,
      size: 20,
    });

    await vi.advanceTimersByTimeAsync(100);

    await expect(execution).resolves.toEqual({
      data: [],
      paging: {
        total: 0,
        has_more: false,
      },
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('deve falhar por timeout quando chamada externa demorar demais', async () => {
    const client = createClient();

    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => ({
                data: [],
                paging: {
                  total: 0,
                  has_more: false,
                },
              }),
            } as Response);
          }, 1000);
        }),
    );

    const execution = client.listOrders({
      page: 1,
      size: 20,
    });

    const rejection = expect(execution).rejects.toBeInstanceOf(IntegrationError);

    await vi.advanceTimersByTimeAsync(1100);
    await rejection;
  });

  it('deve abrir circuit breaker após falhas consecutivas', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockRejectedValue(new Error('psp unavailable'));

    const execution1 = client.listOrders({
      page: 1,
      size: 20,
    });
    const rejection1 = expect(execution1).rejects.toBeInstanceOf(IntegrationError);
    await vi.advanceTimersByTimeAsync(100);
    await rejection1;

    const execution2 = client.listOrders({
      page: 1,
      size: 20,
    });
    const rejection2 = expect(execution2).rejects.toBeInstanceOf(IntegrationError);
    await vi.advanceTimersByTimeAsync(100);
    await rejection2;

    const execution3 = client.listOrders({
      page: 1,
      size: 20,
    });
    await expect(execution3).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve codificar orderId com caracteres especiais', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'or/123 teste',
      }),
    } as Response);

    await client.getOrderById('or/123 teste');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.pagar.me/core/v5/orders/or%2F123%20teste',
      expect.any(Object),
    );
  });
});
