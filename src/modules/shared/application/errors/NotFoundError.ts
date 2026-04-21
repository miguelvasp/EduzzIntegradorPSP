import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';
import { ApplicationError, type ApplicationErrorDetails } from './ApplicationError';

export class NotFoundError extends ApplicationError {
  public constructor(params?: {
    message?: string;
    code?: ErrorCodeValue;
    details?: ApplicationErrorDetails;
    cause?: unknown;
  }) {
    super({
      message: params?.message ?? 'Resource not found',
      code: params?.code ?? ErrorCode.NOT_FOUND,
      category: 'not_found',
      statusCode: 404,
      details: params?.details,
      cause: params?.cause,
      expose: true,
    });
  }
}
