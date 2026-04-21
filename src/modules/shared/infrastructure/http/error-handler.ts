import type { FastifyReply, FastifyRequest } from 'fastify';
import { appLogger } from '../../../../app/server/logging';
import { ApplicationError, InternalError } from '../../application/errors';
import { PayloadSanitizer } from '../security/PayloadSanitizer';

type ErrorResponseBody = {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  requestId: string;
  path: string;
  details?: Record<string, unknown>;
};

function getHttpErrorName(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 404:
      return 'Not Found';
    case 422:
      return 'Unprocessable Entity';
    default:
      return 'Internal Server Error';
  }
}

function getRequestId(request: FastifyRequest): string {
  const headerRequestId = request.headers['x-request-id'];

  if (typeof headerRequestId === 'string' && headerRequestId.trim().length > 0) {
    return headerRequestId;
  }

  if (Array.isArray(headerRequestId) && headerRequestId.length > 0) {
    return headerRequestId[0];
  }

  return request.id;
}

export function handleHttpError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const classifiedError = ApplicationError.isApplicationError(error)
    ? error
    : new InternalError({
        cause: error,
      });

  const requestId = getRequestId(request);
  const statusCode = classifiedError.statusCode;
  const responseMessage = classifiedError.expose
    ? classifiedError.message
    : 'Internal server error';

  const responseDetails =
    classifiedError.expose && classifiedError.details
      ? (PayloadSanitizer.sanitize(classifiedError.details) as Record<string, unknown>)
      : undefined;

  appLogger.error({
    eventType: 'http_error_handled',
    message: 'HTTP request failed',
    errorCode: classifiedError.code,
    status: 'failed',
    context: PayloadSanitizer.sanitize({
      requestId,
      correlationId: request.headers['x-correlation-id'],
      method: request.method,
      url: request.url,
      statusCode,
      category: classifiedError.category,
      details: classifiedError.details,
      cause:
        classifiedError.cause instanceof Error
          ? {
              name: classifiedError.cause.name,
              message: classifiedError.cause.message,
            }
          : classifiedError.cause,
    }) as Record<string, unknown>,
  });

  const body: ErrorResponseBody = {
    timestamp: new Date().toISOString(),
    status: statusCode,
    error: getHttpErrorName(statusCode),
    code: classifiedError.code,
    message: responseMessage,
    requestId,
    path: request.url,
    ...(responseDetails ? { details: responseDetails } : {}),
  };

  void reply.status(statusCode).send(body);
}
