import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    requestStartedAt: number;
  }
}

export function ensureRequestContext(request: FastifyRequest, reply: FastifyReply): void {
  const requestId = resolveRequestId(request);

  request.requestId = requestId;
  request.requestStartedAt = Date.now();

  reply.header(REQUEST_ID_HEADER, requestId);
}

export function getRequestDurationMs(request: FastifyRequest): number | undefined {
  if (!request.requestStartedAt) {
    return undefined;
  }

  return Date.now() - request.requestStartedAt;
}

function resolveRequestId(request: FastifyRequest): string {
  const headerValue =
    readHeaderValue(request.headers[REQUEST_ID_HEADER]) ??
    readHeaderValue(request.headers['x-correlation-id']);

  if (headerValue) {
    return headerValue;
  }

  if (request.id) {
    return String(request.id);
  }

  return randomUUID();
}

function readHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first || undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  return undefined;
}
