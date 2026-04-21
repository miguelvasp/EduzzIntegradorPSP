import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockServer } from '../../mock-server/app/createMockServer';

describe('mock server mercado pago failures', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve responder 500 em cenário controlado', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=failure&failureMode=http_500',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: 'Simulated temporary internal error',
      code: 'mock.internal_error',
    });
  });

  it('deve responder payload inconsistente sem quebrar o servidor', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=failure&failureMode=invalid_payload',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      invalid: true,
      data: 'unexpected-string-payload',
    });
  });

  it('deve atrasar resposta em cenário de timeout', async () => {
    app = await createMockServer();

    const startedAt = Date.now();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=failure&failureMode=timeout&payment_type_id=credit_card&offset=0&limit=1',
    });

    const durationMs = Date.now() - startedAt;

    expect(response.statusCode).toBe(200);
    expect(durationMs).toBeGreaterThanOrEqual(1400);
  });
});
