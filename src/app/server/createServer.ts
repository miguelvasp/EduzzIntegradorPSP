import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerTransactionRoutes } from '../../modules/transactions/presentation/http/transactions.routes';
import { registerErrorLogging } from './http/registerErrorLogging';
import { registerRequestLogging } from './http/registerRequestLogging';

export function createServer(): FastifyInstance {
  const app = Fastify({
    logger: false,
    disableRequestLogging: true,
  });

  void app.register(cors, {
    origin: true,
  });

  registerRequestLogging(app);
  registerErrorLogging(app);

  app.get('/health', async () => {
    return {
      status: 'ok',
    };
  });

  void app.register(async (instance) => {
    await registerTransactionRoutes(instance);
  });

  return app;
}
