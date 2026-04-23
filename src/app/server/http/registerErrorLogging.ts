import type { FastifyInstance } from 'fastify';
import { ApplicationError, NotFoundError } from '../../../modules/shared/application/errors';
import { PayloadSanitizer } from '../../../modules/shared/infrastructure/security/PayloadSanitizer';
import { appLogger } from '../logging';
import { ensureRequestContext, getRequestDurationMs, REQUEST_ID_HEADER } from './requestContext';

export function registerErrorLogging(app: FastifyInstance): void {
  app.setNotFoundHandler(async (request, reply) => {
    ensureRequestContext(request, reply);

    const error = new NotFoundError({
      message: 'Resource not found',
    });

    appLogger.warn({
      eventType: 'http_request_failed',
      message: 'HTTP resource not found',
      status: 'failed',
      durationMs: getRequestDurationMs(request),
      context: {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: error.statusCode,
        error: {
          name: error.name,
          message: error.message,
        },
      },
    });

    reply.header(REQUEST_ID_HEADER, request.requestId);

    return reply.status(error.statusCode).send(
      buildErrorResponse({
        requestId: request.requestId,
        path: request.url,
        error,
      }),
    );
  });

  app.setErrorHandler(async (error, request, reply) => {
    ensureRequestContext(request, reply);

    const normalizedError = ApplicationError.fromUnknown(error);

    appLogger.error({
      eventType: 'http_request_failed',
      message: 'HTTP request failed',
      status: 'failed',
      durationMs: getRequestDurationMs(request),
      context: {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: normalizedError.statusCode,
        error: {
          name: normalizedError.name,
          message: normalizedError.message,
          code: normalizedError.code,
        },
      },
    });

    if (reply.sent) {
      return reply;
    }

    reply.header(REQUEST_ID_HEADER, request.requestId);

    return reply.status(normalizedError.statusCode).send(
      buildErrorResponse({
        requestId: request.requestId,
        path: request.url,
        error: normalizedError,
      }),
    );
  });
}

function buildErrorResponse(params: {
  requestId: string;
  path: string;
  error: ApplicationError;
}): Record<string, unknown> {
  const response: Record<string, unknown> = {
    status: params.error.statusCode,
    error: mapStatusText(params.error.statusCode),
    code: params.error.code,
    message: params.error.message,
    path: params.path,
    requestId: params.requestId,
    timestamp: new Date().toISOString(),
  };

  if (params.error.expose && params.error.details) {
    response.details = PayloadSanitizer.sanitize(params.error.details);
  }

  return response;
}

function mapStatusText(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 404:
      return 'Not Found';
    case 422:
      return 'Unprocessable Entity';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Error';
  }
}
