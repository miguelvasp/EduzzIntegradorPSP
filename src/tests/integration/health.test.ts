import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../../app/server/createServer';

describe('GET /health', () => {
  const app = createServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return application health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
  });
});
