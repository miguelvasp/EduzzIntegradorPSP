import type { FastifyInstance } from 'fastify';
import { appLogger } from '../logging';
import { ensureRequestContext, getRequestDurationMs } from './requestContext';

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook('onRequest', async (request, reply) => {
    ensureRequestContext(request, reply);

    appLogger.info({
      eventType: 'http_request_started',
      message: 'HTTP request started',
      status: 'started',
      context: {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
    });
  });

  app.addHook('onResponse', async (request, reply) => {
    appLogger.info({
      eventType: 'http_request_completed',
      message: 'HTTP request completed',
      status: reply.statusCode >= 400 ? 'failed' : 'completed',
      durationMs: getRequestDurationMs(request),
      context: {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
      },
    });
  });
}
