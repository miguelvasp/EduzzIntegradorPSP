import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { LogContextFactory } from '../../../modules/shared/infrastructure/logging/LogContextFactory';
import { RequestContext } from '../../../modules/shared/infrastructure/logging/RequestContext';
import { appLogger } from '../logging';

type RequestWithLogging = FastifyRequest & {
  requestId?: string;
  correlationId?: string;
  startedAt?: number;
};

export function registerHttpLogging(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: RequestWithLogging) => {
    const requestId =
      (request.headers['x-request-id'] as string | undefined)?.trim() || randomUUID();

    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined)?.trim() || requestId;

    request.requestId = requestId;
    request.correlationId = correlationId;
    request.startedAt = Date.now();

    const context = RequestContext.createBaseContext(
      LogContextFactory.forHttp({
        requestId,
        correlationId,
      }),
    );

    RequestContext.run(context, () => {
      appLogger.info({
        eventType: 'http_request',
        message: 'HTTP request started',
        status: 'started',
        context: {
          method: request.method,
          url: request.url,
        },
      });
    });
  });

  app.addHook('onResponse', async (request: RequestWithLogging, reply: FastifyReply) => {
    const durationMs = request.startedAt ? Date.now() - request.startedAt : undefined;

    const context = RequestContext.createBaseContext(
      LogContextFactory.forHttp({
        requestId: request.requestId,
        correlationId: request.correlationId,
      }),
    );

    RequestContext.run(context, () => {
      appLogger.info({
        eventType: 'http_response',
        message: 'HTTP request completed',
        status: 'completed',
        durationMs,
        context: {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
        },
      });
    });
  });
}
