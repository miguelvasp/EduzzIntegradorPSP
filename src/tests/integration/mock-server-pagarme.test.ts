import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockServer } from '../../mock-server/app/createMockServer';

describe('mock server pagarme', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve listar pedidos com paginação básica', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?page=1&size=1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [
        expect.objectContaining({
          id: 'or_pag_001',
        }),
      ],
      paging: {
        total: 2,
        has_more: true,
      },
    });
  });

  it('deve detalhar pedido existente', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders/or_pag_001',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: 'or_pag_001',
      }),
    );
  });

  it('deve retornar 404 para pedido inexistente', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders/inexistente',
    });

    expect(response.statusCode).toBe(404);
  });
});
