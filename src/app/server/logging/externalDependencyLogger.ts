import { ApplicationError } from '../../../modules/shared/application/errors';
import { PayloadSanitizer } from '../../../modules/shared/infrastructure/security/PayloadSanitizer';
import { appLogger } from '../logging';

type ExternalDependencyProvider = 'pagarme' | 'mercadopago';

type ExternalDependencyBaseParams = {
  provider: ExternalDependencyProvider;
  operation: string;
  endpoint: string;
  context?: Record<string, unknown>;
};

type ExternalDependencySuccessParams = ExternalDependencyBaseParams & {
  startedAt: number;
};

type ExternalDependencyRetryParams = ExternalDependencyBaseParams & {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  error: unknown;
};

type ExternalDependencyRateLimitedParams = ExternalDependencyBaseParams & {
  retryAfterMs?: number;
};

type ExternalDependencyFailureParams = ExternalDependencyBaseParams & {
  startedAt: number;
  error: unknown;
};

export function logExternalDependencySuccess(params: ExternalDependencySuccessParams): void {
  appLogger.info({
    eventType: 'external_dependency_success',
    message: 'External dependency request completed',
    status: 'completed',
    durationMs: Date.now() - params.startedAt,
    context: {
      provider: params.provider,
      operation: params.operation,
      endpoint: params.endpoint,
      ...params.context,
    },
  });
}

export function logExternalDependencyRetry(params: ExternalDependencyRetryParams): void {
  const normalizedError = normalizeError(params.error);

  appLogger.warn({
    eventType: 'external_dependency_retry',
    message: 'External dependency request will be retried',
    status: 'retrying',
    errorCode: normalizedError.errorCode,
    context: PayloadSanitizer.sanitize({
      provider: params.provider,
      operation: params.operation,
      endpoint: params.endpoint,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      delayMs: params.delayMs,
      errorClass: normalizedError.errorClass,
      ...params.context,
      error: normalizedError.error,
    }) as Record<string, unknown>,
  });
}

export function logExternalDependencyRateLimited(
  params: ExternalDependencyRateLimitedParams,
): void {
  appLogger.warn({
    eventType: 'external_dependency_rate_limited',
    message: 'External dependency rate limited',
    status: 'rate_limited',
    context: {
      provider: params.provider,
      operation: params.operation,
      endpoint: params.endpoint,
      retryAfterMs: params.retryAfterMs,
      ...params.context,
    },
  });
}

export function logExternalDependencyFailure(params: ExternalDependencyFailureParams): void {
  const normalizedError = normalizeError(params.error);

  appLogger.error({
    eventType: 'external_dependency_failure',
    message: 'External dependency request failed',
    status: 'failed',
    errorCode: normalizedError.errorCode,
    durationMs: Date.now() - params.startedAt,
    context: PayloadSanitizer.sanitize({
      provider: params.provider,
      operation: params.operation,
      endpoint: params.endpoint,
      errorClass: normalizedError.errorClass,
      statusCode: normalizedError.statusCode,
      retryable: normalizedError.retryable,
      ...params.context,
      error: normalizedError.error,
    }) as Record<string, unknown>,
  });
}

function normalizeError(error: unknown): {
  errorCode?: string;
  errorClass: 'timeout' | 'upstream_4xx' | 'upstream_5xx' | 'unavailable' | 'failure';
  statusCode?: number;
  retryable: boolean;
  error:
    | {
        name?: string;
        message?: string;
      }
    | unknown;
} {
  const applicationError = ApplicationError.isApplicationError(error) ? error : undefined;
  const details = applicationError?.details;
  const statusCode = readStatusCode(details);
  const cause = applicationError?.cause;
  const name = readErrorName(error, cause);
  const message = readErrorMessage(error, cause).toLowerCase();

  if (name === 'TimeoutError' || message.includes('timed out') || message.includes('timeout')) {
    return {
      errorCode: applicationError?.code,
      errorClass: 'timeout',
      statusCode,
      retryable: true,
      error: buildErrorPayload(error, cause),
    };
  }

  if (
    name === 'CircuitBreakerOpenError' ||
    message.includes('temporarily unavailable') ||
    message.includes('open circuit') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed') ||
    message.includes('socket hang up') ||
    message.includes('network')
  ) {
    return {
      errorCode: applicationError?.code,
      errorClass: 'unavailable',
      statusCode,
      retryable: true,
      error: buildErrorPayload(error, cause),
    };
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return {
      errorCode: applicationError?.code,
      errorClass: 'upstream_5xx',
      statusCode,
      retryable: true,
      error: buildErrorPayload(error, cause),
    };
  }

  if (typeof statusCode === 'number' && statusCode >= 400) {
    return {
      errorCode: applicationError?.code,
      errorClass: 'upstream_4xx',
      statusCode,
      retryable: statusCode === 429,
      error: buildErrorPayload(error, cause),
    };
  }

  return {
    errorCode: applicationError?.code,
    errorClass: 'failure',
    statusCode,
    retryable: false,
    error: buildErrorPayload(error, cause),
  };
}

function readStatusCode(details: Record<string, unknown> | undefined): number | undefined {
  const value = details?.statusCode;

  return typeof value === 'number' ? value : undefined;
}

function readErrorName(error: unknown, cause: unknown): string | undefined {
  if (cause instanceof Error && cause.name) {
    return cause.name;
  }

  if (error instanceof Error && error.name) {
    return error.name;
  }

  return undefined;
}

function readErrorMessage(error: unknown, cause: unknown): string {
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown external dependency error';
}

function buildErrorPayload(
  error: unknown,
  cause: unknown,
):
  | {
      name?: string;
      message?: string;
      cause?: {
        name?: string;
        message?: string;
      };
    }
  | unknown {
  const base =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
        }
      : error;

  if (!(cause instanceof Error)) {
    return base;
  }

  return {
    ...(typeof base === 'object' && base !== null ? base : { error: base }),
    cause: {
      name: cause.name,
      message: cause.message,
    },
  };
}
