import { describe, expect, it } from 'vitest';
import {
  ApplicationError,
  DomainError,
  IntegrationError,
  InternalError,
  NotFoundError,
  ValidationError,
} from '../../modules/shared/application/errors';
import { ErrorCode } from '../../modules/shared/domain/error-codes/errorCode';

describe('application errors', () => {
  it('deve criar ValidationError com status 400', () => {
    const error = new ValidationError();

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.statusCode).toBe(400);
    expect(error.category).toBe('validation');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.expose).toBe(true);
  });

  it('deve criar DomainError com status 422', () => {
    const error = new DomainError();

    expect(error.statusCode).toBe(422);
    expect(error.category).toBe('domain');
    expect(error.code).toBe(ErrorCode.DOMAIN_ERROR);
    expect(error.expose).toBe(true);
  });

  it('deve criar NotFoundError com status 404', () => {
    const error = new NotFoundError();

    expect(error.statusCode).toBe(404);
    expect(error.category).toBe('not_found');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.expose).toBe(true);
  });

  it('deve criar IntegrationError com status 500 exposto', () => {
    const error = new IntegrationError();

    expect(error.statusCode).toBe(500);
    expect(error.category).toBe('integration');
    expect(error.code).toBe(ErrorCode.INTEGRATION_ERROR);
    expect(error.expose).toBe(true);
  });

  it('deve criar InternalError com status 500 sem exposição', () => {
    const error = new InternalError();

    expect(error.statusCode).toBe(500);
    expect(error.category).toBe('internal');
    expect(error.code).toBe(ErrorCode.INFRASTRUCTURE_ERROR);
    expect(error.expose).toBe(false);
  });

  it('deve converter erro desconhecido para ApplicationError interno', () => {
    const error = ApplicationError.fromUnknown(new Error('boom'));

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.statusCode).toBe(500);
    expect(error.category).toBe('internal');
    expect(error.code).toBe(ErrorCode.INFRASTRUCTURE_ERROR);
    expect(error.expose).toBe(false);
  });

  it('deve manter ApplicationError já classificado no fromUnknown', () => {
    const original = new ValidationError({
      message: 'invalid input',
    });

    const result = ApplicationError.fromUnknown(original);

    expect(result).toBe(original);
  });
});
