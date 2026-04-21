import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';
import { ApplicationError, type ApplicationErrorDetails } from './ApplicationError';

export class DomainError extends ApplicationError {
  public constructor(params?: {
    message?: string;
    code?: ErrorCodeValue;
    details?: ApplicationErrorDetails;
    cause?: unknown;
  }) {
    super({
      message: params?.message ?? 'Business rule violation',
      code: params?.code ?? ErrorCode.DOMAIN_ERROR,
      category: 'domain',
      statusCode: 422,
      details: params?.details,
      cause: params?.cause,
      expose: true,
    });
  }
}
