import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../../app/server/createServer';
import { appLogger } from '../../app/server/logging';

describe('http observability integration', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
  });

  it('deve logar inicio e fim da request e devolver x-request-id', async () => {
    const app = createServer();
    const infoSpy = vi.spyOn(appLogger, 'info').mockImplementation(() => undefined);

    app.get('/__test/observability', async (fastifyRequest) => {
      const requestWithContext = fastifyRequest as typeof fastifyRequest & {
        requestId?: string;
      };

      return {
        ok: true,
        requestId: requestWithContext.requestId,
      };
    });

    await app.ready();

    const response = await request(app.server)
      .get('/__test/observability')
      .set('x-request-id', 'req-obs-123');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-obs-123');
    expect(response.body).toEqual({
      ok: true,
      requestId: 'req-obs-123',
    });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'http_request_started',
        message: 'HTTP request started',
        status: 'started',
        context: expect.objectContaining({
          requestId: 'req-obs-123',
          method: 'GET',
          url: '/__test/observability',
        }),
      }),
    );

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'http_request_completed',
        message: 'HTTP request completed',
        status: 'completed',
        durationMs: expect.any(Number),
        context: expect.objectContaining({
          requestId: 'req-obs-123',
          method: 'GET',
          url: '/__test/observability',
          statusCode: 200,
        }),
      }),
    );

    await app.close();
  });
});
