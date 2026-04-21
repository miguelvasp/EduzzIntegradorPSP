import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';
import { ApplicationError, type ApplicationErrorDetails } from './ApplicationError';

export class InternalError extends ApplicationError {
  public constructor(params?: {
    message?: string;
    code?: ErrorCodeValue;
    details?: ApplicationErrorDetails;
    cause?: unknown;
  }) {
    super({
      message: params?.message ?? 'Internal server error',
      code: params?.code ?? ErrorCode.INFRASTRUCTURE_ERROR,
      category: 'internal',
      statusCode: 500,
      details: params?.details,
      cause: params?.cause,
      expose: false,
    });
  }
}
