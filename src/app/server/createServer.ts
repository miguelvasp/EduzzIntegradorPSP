import cors from '@fastify/cors';
import Fastify from 'fastify';

export function createServer() {
  const app = Fastify({
    logger: true,
  });

  void app.register(cors);

  app.get('/health', async () => {
    return {
      status: 'ok',
    };
  });

  return app;
}
