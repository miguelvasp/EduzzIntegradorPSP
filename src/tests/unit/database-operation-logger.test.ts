import { afterEach, describe, expect, it, vi } from 'vitest';
import { appLogger } from '../../app/server/logging';
import { logDatabaseOperationFailure } from '../../app/server/logging/databaseOperationLogger';

describe('databaseOperationLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve logar falha de banco padronizada', () => {
    const errorSpy = vi.spyOn(appLogger, 'error').mockImplementation(() => undefined);
    const error = Object.assign(new Error('Violation of UNIQUE KEY constraint'), {
      code: 'EREQUEST',
    });

    logDatabaseOperationFailure({
      repository: 'SqlServerIdempotencyRepository',
      operation: 'registerDecision',
      entity: 'idempotency_registry',
      error,
      context: {
        externalId: 'or_123',
        psp: 'pagarme',
      },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'database_operation_failed',
        message: 'Database operation failed',
        status: 'failed',
        errorCode: 'EREQUEST',
        context: expect.objectContaining({
          repository: 'SqlServerIdempotencyRepository',
          operation: 'registerDecision',
          entity: 'idempotency_registry',
          errorName: 'Error',
          errorMessage: 'Violation of UNIQUE KEY constraint',
          externalId: 'or_123',
          psp: 'pagarme',
        }),
      }),
    );
  });
});
