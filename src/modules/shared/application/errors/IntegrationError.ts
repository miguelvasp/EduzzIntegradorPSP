import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';
import { ApplicationError, type ApplicationErrorDetails } from './ApplicationError';

export class IntegrationError extends ApplicationError {
  public constructor(params?: {
    message?: string;
    code?: ErrorCodeValue;
    details?: ApplicationErrorDetails;
    cause?: unknown;
  }) {
    super({
      message: params?.message ?? 'External integration failed',
      code: params?.code ?? ErrorCode.INTEGRATION_ERROR,
      category: 'integration',
      statusCode: 500,
      details: params?.details,
      cause: params?.cause,
      expose: true,
    });
  }
}
