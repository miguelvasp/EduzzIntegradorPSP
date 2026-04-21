import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';
import { ApplicationError, type ApplicationErrorDetails } from './ApplicationError';

export class ValidationError extends ApplicationError {
  public constructor(params?: {
    message?: string;
    code?: ErrorCodeValue;
    details?: ApplicationErrorDetails;
    cause?: unknown;
  }) {
    super({
      message: params?.message ?? 'Invalid request parameters',
      code: params?.code ?? ErrorCode.VALIDATION_ERROR,
      category: 'validation',
      statusCode: 400,
      details: params?.details,
      cause: params?.cause,
      expose: true,
    });
  }
}
