import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { createMockServer } from '../../mock-server/app/createMockServer';

describe('mock server mercado pago scenarios', () => {
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
      url: '/v1/payments/search?scenario=pagination&payment_type_id=credit_card&offset=0&limit=2',
    });

    const page2 = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=pagination&payment_type_id=credit_card&offset=2&limit=2',
    });

    const page3 = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=pagination&payment_type_id=credit_card&offset=4&limit=2',
    });

    expect(page1.statusCode).toBe(200);
    expect(page2.statusCode).toBe(200);
    expect(page3.statusCode).toBe(200);

    expect(page1.json().results).toHaveLength(2);
    expect(page1.json().paging.total).toBe(5);

    expect(page2.json().results).toHaveLength(2);
    expect(page3.json().results).toHaveLength(1);
  });

  it('deve expor duplicidade e atualização mais nova no cenário de reimportação', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=reimport&payment_type_id=credit_card&offset=0&limit=10',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.results).toHaveLength(3);
    expect(body.results[0].id).toBe(4001);
    expect(body.results[1].id).toBe(4001);
    expect(body.results[2].date_last_updated).toBe('2026-04-22T12:00:00.000Z');
  });

  it('deve expor cenários inválidos para validação negativa', async () => {
    app = await createMockServer();

    const allResponse = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=validation&offset=0&limit=10',
    });

    const creditCardResponse = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=validation&payment_type_id=credit_card&offset=0&limit=10',
    });

    const allResults = allResponse.json().results;
    const creditCardResults = creditCardResponse.json().results;

    expect(allResponse.statusCode).toBe(200);
    expect(creditCardResponse.statusCode).toBe(200);

    expect(allResults).toHaveLength(2);
    expect(creditCardResults).toHaveLength(2);

    expect(creditCardResults[0].payer).toBeUndefined();
    expect(creditCardResults[1].installments).toBeUndefined();
  });

  it('deve permitir descarte por meio de pagamento fora do escopo', async () => {
    app = await createMockServer();

    const allResponse = await app.inject({
      method: 'GET',
      url: '/v1/payments/search?scenario=validation&payment_type_id=pix&offset=0&limit=10',
    });

    expect(allResponse.statusCode).toBe(200);
    expect(allResponse.json().results).toHaveLength(1);
    expect(allResponse.json().results[0].payment_type_id).toBe('pix');
  });

  it('deve manter detalhe coerente com a listagem no cenário selecionado', async () => {
    app = await createMockServer();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/payments/3003?scenario=pagination',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        id: 3003,
      }),
    );
  });
});
