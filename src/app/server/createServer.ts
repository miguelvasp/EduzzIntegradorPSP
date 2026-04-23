import cors from '@fastify/cors';
import Fastify from 'fastify';
import { handleHttpError } from '../../modules/shared/infrastructure/http/error-handler';
import { registerTransactionRoutes } from '../../modules/transactions/presentation/http/transactions.routes';
import { registerHttpLogging } from './middlewares/httpLogging';

export function createServer() {
  const app = Fastify({
    logger: true,
  });

  registerHttpLogging(app);

  void app.register(cors);
  void app.register(registerTransactionRoutes);

  app.setErrorHandler((error, request, reply) => {
    handleHttpError(error, request, reply);
  });

  app.get('/health', async () => {
    return {
      status: 'ok',
    };
  });

  return app;
}
