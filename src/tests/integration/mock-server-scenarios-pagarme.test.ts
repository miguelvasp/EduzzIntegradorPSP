import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockServer } from '../../mock-server/app/createMockServer';

describe('mock server pagarme scenarios', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve suportar paginação com múltiplas páginas e última página incompleta', async () => {
    app = await createMockServer();

    const page1 = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?scenario=pagination&page=1&size=2',
    });

    const page2 = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?scenario=pagination&page=2&size=2',
    });

    const page3 = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?scenario=pagination&page=3&size=2',
    });

    expect(page1.statusCode).toBe(200);
    expect(page2.statusCode).toBe(200);
    expect(page3.statusCode).toBe(200);

    expect(page1.json().data).toHaveLength(2);
    expect(page1.json().paging.has_more).toBe(true);

    expect(page2.json().data).toHaveLength(2);
    expect(page2.json().paging.has_more).toBe(true);

    expect(page3.json().data).toHaveLength(1);
    expect(page3.json().paging.has_more).toBe(false);
  });

  it('deve expor transação duplicada e transação com updated_at mais novo no cenário de reimportação', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?scenario=reimport&page=1&size=10',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.data[0].id).toBe('or_pag_reimport_001');
    expect(body.data[1].id).toBe('or_pag_reimport_001');
    expect(body.data[2].updated_at).toBe('2026-04-22T11:30:00.000Z');
  });

  it('deve expor cenários inválidos para validação negativa', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders?scenario=validation&page=1&size=10',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.data).toHaveLength(3);

    expect(body.data[0].customer).toBeUndefined();
    expect(body.data[1].charges[0].last_transaction.installments).toBeUndefined();
    expect(body.data[2].charges[0].payment_method).toBe('pix');
  });

  it('deve manter detalhe coerente com a listagem no cenário selecionado', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/core/v5/orders/or_pag_page_003?scenario=pagination',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: 'or_pag_page_003',
      }),
    );
  });
});
