import { describe, expect, it } from 'vitest';
import {
  DomainError,
  IntegrationError,
  ValidationError,
} from '../../modules/shared/application/errors';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ErrorCode } from '../../modules/shared/domain/error-codes/errorCode';
import { ItemFailureHandler } from '../../modules/sync/application/services/ItemFailureHandler';

describe('ItemFailureHandler', () => {
  it('deve classificar ValidationError como rejected', () => {
    const handler = new ItemFailureHandler();

    const result = handler.handle({
      error: new ValidationError({
        message: 'Invalid item',
        code: ErrorCode.VALIDATION_ERROR,
      }),
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
    });

    expect(result).toEqual({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      status: 'rejected',
      errorCategory: 'validation',
      errorCode: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid item',
      shouldContinue: true,
    });
  });

  it('deve classificar DomainError como conflicted', () => {
    const handler = new ItemFailureHandler();

    const result = handler.handle({
      error: new DomainError({
        message: 'Conflicting item',
        code: ErrorCode.DOMAIN_ERROR,
      }),
      psp: PspType.MERCADO_PAGO,
      externalId: 'mp_1',
      syncRunId: 'sync-1',
    });

    expect(result.status).toBe('conflicted');
    expect(result.errorCategory).toBe('domain');
    expect(result.shouldContinue).toBe(true);
  });

  it('deve classificar IntegrationError como failed', () => {
    const handler = new ItemFailureHandler();

    const result = handler.handle({
      error: new IntegrationError({
        message: 'Integration issue',
        code: ErrorCode.INTEGRATION_ERROR,
      }),
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
    });

    expect(result.status).toBe('failed');
    expect(result.errorCategory).toBe('integration');
    expect(result.shouldContinue).toBe(true);
  });

  it('deve classificar erro genérico como failed', () => {
    const handler = new ItemFailureHandler();

    const result = handler.handle({
      error: new Error('Unexpected failure'),
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
    });

    expect(result.status).toBe('failed');
    expect(result.errorCategory).toBe('internal');
    expect(result.errorCode).toBe('unexpected.item_processing_failure');
    expect(result.shouldContinue).toBe(true);
  });
});
