import cors from '@fastify/cors';
import Fastify from 'fastify';
import { handleHttpError } from '../../modules/shared/infrastructure/http/error-handler';
import { registerHttpLogging } from './middlewares/httpLogging';

export function createServer() {
  const app = Fastify({
    logger: true,
  });

  registerHttpLogging(app);

  void app.register(cors);

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
