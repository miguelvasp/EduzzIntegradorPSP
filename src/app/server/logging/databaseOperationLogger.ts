import { PayloadSanitizer } from '../../../modules/shared/infrastructure/security/PayloadSanitizer';
import { appLogger } from '../logging';

type DatabaseOperationFailureParams = {
  repository: string;
  operation: string;
  entity: string;
  error: unknown;
  context?: Record<string, unknown>;
};

export function logDatabaseOperationFailure(params: DatabaseOperationFailureParams): void {
  const normalizedError = normalizeError(params.error);

  appLogger.error({
    eventType: 'database_operation_failed',
    message: 'Database operation failed',
    status: 'failed',
    errorCode: normalizedError.errorCode,
    context: PayloadSanitizer.sanitize({
      repository: params.repository,
      operation: params.operation,
      entity: params.entity,
      errorName: normalizedError.errorName,
      errorMessage: normalizedError.errorMessage,
      ...params.context,
    }) as Record<string, unknown>,
  });
}

function normalizeError(error: unknown): {
  errorName: string;
  errorMessage: string;
  errorCode?: string;
} {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: string };

    return {
      errorName: candidate.name || 'Error',
      errorMessage: candidate.message || 'Unknown database error',
      errorCode: candidate.code,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      name?: string;
      message?: string;
      code?: string;
    };

    return {
      errorName: candidate.name ?? 'UnknownError',
      errorMessage: candidate.message ?? 'Unknown database error',
      errorCode: candidate.code,
    };
  }

  return {
    errorName: 'UnknownError',
    errorMessage: 'Unknown database error',
  };
}
