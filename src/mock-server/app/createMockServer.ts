import Fastify, { type FastifyInstance } from 'fastify';
import { registerMercadoPagoRoutes } from './registerMercadoPagoRoutes';
import { registerPagarmeRoutes } from './registerPagarmeRoutes';

export async function createMockServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  await registerPagarmeRoutes(app);
  await registerMercadoPagoRoutes(app);

  return app;
}
