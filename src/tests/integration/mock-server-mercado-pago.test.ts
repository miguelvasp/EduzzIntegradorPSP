import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockServer } from '../../mock-server/app/createMockServer';

describe('mock server mercado pago', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve listar payments com paginação básica', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?payment_type_id=credit_card&offset=0&limit=1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: [
        expect.objectContaining({
          id: 1001,
        }),
      ],
      paging: {
        total: 2,
        limit: 1,
        offset: 0,
      },
    });
  });

  it('deve detalhar payment existente', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/1001',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: 1001,
      }),
    );
  });

  it('deve retornar 404 para payment inexistente', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/999999',
    });

    expect(response.statusCode).toBe(404);
  });
});
