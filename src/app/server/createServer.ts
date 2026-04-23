import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerSyncRoutes } from '../../modules/sync/presentation/http/sync.routes';
import { registerTransactionRoutes } from '../../modules/transactions/presentation/http/transactions.routes';
import { registerSwagger } from './docs/registerSwagger';
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

  void app.register(async (instance) => {
    await registerSwagger(instance);

    instance.get(
      '/health',
      {
        schema: {
          tags: ['Health'],
          summary: 'Health check da aplicação',
          response: {
            200: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
        },
      },
      async () => {
        return {
          status: 'ok',
        };
      },
    );

    await registerSyncRoutes(instance);
    await registerTransactionRoutes(instance);
  });

  return app;
}
