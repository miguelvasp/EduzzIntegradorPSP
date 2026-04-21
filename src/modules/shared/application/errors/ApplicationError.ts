import { ErrorCode, type ErrorCode as ErrorCodeValue } from '../../domain/error-codes/errorCode';

export type ApplicationErrorCategory =
  | 'validation'
  | 'domain'
  | 'not_found'
  | 'integration'
  | 'internal'
  | 'configuration'
  | 'security';

export type ApplicationErrorDetails = Record<string, unknown>;

export type ApplicationErrorParams = {
  message: string;
  code: ErrorCodeValue;
  category: ApplicationErrorCategory;
  statusCode: number;
  details?: ApplicationErrorDetails;
  cause?: unknown;
  expose?: boolean;
};

export class ApplicationError extends Error {
  public readonly code: ErrorCodeValue;
  public readonly category: ApplicationErrorCategory;
  public readonly statusCode: number;
  public readonly details?: ApplicationErrorDetails;
  public readonly cause?: unknown;
  public readonly expose: boolean;

  public constructor(params: ApplicationErrorParams) {
    super(params.message);

    this.name = this.constructor.name;
    this.code = params.code;
    this.category = params.category;
    this.statusCode = params.statusCode;
    this.details = params.details;
    this.cause = params.cause;
    this.expose = params.expose ?? true;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static isApplicationError(error: unknown): error is ApplicationError {
    return error instanceof ApplicationError;
  }

  public static fromUnknown(error: unknown): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApplicationError({
        message: 'Internal server error',
        code: ErrorCode.INFRASTRUCTURE_ERROR,
        category: 'internal',
        statusCode: 500,
        cause: error,
        expose: false,
      });
    }

    return new ApplicationError({
      message: 'Internal server error',
      code: ErrorCode.INFRASTRUCTURE_ERROR,
      category: 'internal',
      statusCode: 500,
      details: {
        rawError: error,
      },
      expose: false,
    });
  }
}
