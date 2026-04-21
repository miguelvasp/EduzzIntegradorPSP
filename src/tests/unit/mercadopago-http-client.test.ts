import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MercadoPagoHttpClient } from '../../modules/psp/infrastructure/clients/mercadopago/MercadoPagoHttpClient';
import { IntegrationError, ValidationError } from '../../modules/shared/application/errors';

describe('MercadoPagoHttpClient', () => {
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
    return new MercadoPagoHttpClient({
      baseUrl: 'https://api.mercadopago.com',
      accessToken: 'test-access-token',
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
        new MercadoPagoHttpClient({
          baseUrl: '',
          accessToken: 'test-access-token',
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

  it('deve falhar ao criar client sem accessToken', () => {
    expect(
      () =>
        new MercadoPagoHttpClient({
          baseUrl: 'https://api.mercadopago.com',
          accessToken: '',
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

  it('deve buscar pagamentos com parâmetros corretos', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        paging: {
          total: 1,
          limit: 20,
          offset: 0,
        },
        results: [
          {
            id: 123456789,
            payment_type_id: 'credit_card',
          },
        ],
      }),
    } as Response);

    const result = await client.searchPayments({
      offset: 0,
      limit: 20,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/payments/search?payment_type_id=credit_card&offset=0&limit=20',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer test-access-token',
        },
      },
    );

    expect(result).toEqual({
      paging: {
        total: 1,
        limit: 20,
        offset: 0,
      },
      results: [
        {
          id: 123456789,
          payment_type_id: 'credit_card',
        },
      ],
    });
  });

  it('deve buscar detalhe do pagamento por id', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 123456789,
        payment_type_id: 'credit_card',
      }),
    } as Response);

    const result = await client.getPaymentById('123456789');

    expect(global.fetch).toHaveBeenCalledWith('https://api.mercadopago.com/v1/payments/123456789', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer test-access-token',
      },
    });

    expect(result).toEqual({
      id: 123456789,
      payment_type_id: 'credit_card',
    });
  });

  it('deve validar offset inválido', async () => {
    const client = createClient();

    await expect(
      client.searchPayments({
        offset: -1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve validar limit inválido', async () => {
    const client = createClient();

    await expect(
      client.searchPayments({
        offset: 0,
        limit: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve validar paymentId inválido', async () => {
    const client = createClient();

    await expect(client.getPaymentById('')).rejects.toBeInstanceOf(ValidationError);
  });

  it('deve falhar quando contrato de busca vier inválido', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: {},
      }),
    } as Response);

    await expect(
      client.searchPayments({
        offset: 0,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve falhar quando contrato de detalhe vier inválido', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => null,
    } as Response);

    await expect(client.getPaymentById('123456789')).rejects.toBeInstanceOf(IntegrationError);
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

    const execution = client.searchPayments({
      offset: 0,
      limit: 20,
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
          paging: {
            total: 0,
            limit: 20,
            offset: 0,
          },
          results: [],
        }),
      } as Response);

    const execution = client.searchPayments({
      offset: 0,
      limit: 20,
    });

    await vi.advanceTimersByTimeAsync(100);

    await expect(execution).resolves.toEqual({
      paging: {
        total: 0,
        limit: 20,
        offset: 0,
      },
      results: [],
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
                paging: {
                  total: 0,
                  limit: 20,
                  offset: 0,
                },
                results: [],
              }),
            } as Response);
          }, 1000);
        }),
    );

    const execution = client.searchPayments({
      offset: 0,
      limit: 20,
    });

    const rejection = expect(execution).rejects.toBeInstanceOf(IntegrationError);

    await vi.advanceTimersByTimeAsync(1100);
    await rejection;
  });

  it('deve abrir circuit breaker após falhas consecutivas', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockRejectedValue(new Error('psp unavailable'));

    const execution1 = client.searchPayments({
      offset: 0,
      limit: 20,
    });
    const rejection1 = expect(execution1).rejects.toBeInstanceOf(IntegrationError);
    await vi.advanceTimersByTimeAsync(100);
    await rejection1;

    const execution2 = client.searchPayments({
      offset: 0,
      limit: 20,
    });
    const rejection2 = expect(execution2).rejects.toBeInstanceOf(IntegrationError);
    await vi.advanceTimersByTimeAsync(100);
    await rejection2;

    const execution3 = client.searchPayments({
      offset: 0,
      limit: 20,
    });

    await expect(execution3).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve codificar paymentId com caracteres especiais', async () => {
    const client = createClient();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'abc/123 teste',
      }),
    } as Response);

    await client.getPaymentById('abc/123 teste');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/payments/abc%2F123%20teste',
      expect.any(Object),
    );
  });
});
