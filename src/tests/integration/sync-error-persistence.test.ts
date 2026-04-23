import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ItemFailureHandler } from '../../modules/sync/application/services/ItemFailureHandler';

describe('sync error persistence integration', () => {
  it('deve gravar integration_errors para erro técnico externo', async () => {
    const syncPersistenceService = {
      failIncomingItem: vi.fn().mockResolvedValue(undefined),
      registerIntegrationError: vi.fn().mockResolvedValue(undefined),
      registerProcessingError: vi.fn(),
    };

    const syncRejectionRecorder = {
      record: vi.fn(),
    };

    const syncConflictRecorder = {
      record: vi.fn(),
    };

    const handler = new ItemFailureHandler(
      syncPersistenceService as never,
      syncRejectionRecorder as never,
      syncConflictRecorder as never,
    );

    const networkError = Object.assign(new Error('timeout while calling upstream PSP'), {
      code: 'ETIMEDOUT',
    });

    await handler.handle({
      error: networkError,
      syncRunDbId: 300,
      correlationId: 'corr-int-error',
      syncItemId: 7771,
      item: { id: 'or_timeout_1' },
      psp: PspType.PAGARME,
      externalId: 'or_timeout_1',
      resourceType: 'transaction',
      rawPayload: {
        id: 'or_timeout_1',
      },
    });

    expect(syncPersistenceService.failIncomingItem).toHaveBeenCalledWith({
      syncItemId: 7771,
    });
    expect(syncPersistenceService.registerIntegrationError).toHaveBeenCalledTimes(1);
    expect(syncPersistenceService.registerIntegrationError).toHaveBeenCalledWith(
      expect.objectContaining({
        syncRunId: 300,
        syncItemId: 7771,
        psp: PspType.PAGARME,
        errorType: 'timeout',
        errorCode: 'ETIMEDOUT',
        retryable: true,
      }),
    );
    expect(syncRejectionRecorder.record).not.toHaveBeenCalled();
    expect(syncConflictRecorder.record).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerProcessingError).not.toHaveBeenCalled();
  });

  it('deve gravar processing_errors para erro interno de processamento', async () => {
    const syncPersistenceService = {
      failIncomingItem: vi.fn().mockResolvedValue(undefined),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn().mockResolvedValue(undefined),
    };

    const syncRejectionRecorder = {
      record: vi.fn(),
    };

    const syncConflictRecorder = {
      record: vi.fn(),
    };

    const handler = new ItemFailureHandler(
      syncPersistenceService as never,
      syncRejectionRecorder as never,
      syncConflictRecorder as never,
    );

    await handler.handle({
      error: new Error('unexpected null pointer while mapping canonical transaction'),
      syncRunDbId: 301,
      correlationId: 'corr-proc-error',
      syncItemId: 8881,
      item: { id: 'mp_processing_1' },
      psp: PspType.MERCADO_PAGO,
      externalId: 'mp_processing_1',
      resourceType: 'transaction',
      rawPayload: {
        id: 'mp_processing_1',
      },
    });

    expect(syncPersistenceService.failIncomingItem).toHaveBeenCalledWith({
      syncItemId: 8881,
    });
    expect(syncPersistenceService.registerProcessingError).toHaveBeenCalledTimes(1);
    expect(syncPersistenceService.registerProcessingError).toHaveBeenCalledWith(
      expect.objectContaining({
        syncRunId: 301,
        syncItemId: 8881,
        processingStage: 'item_processing',
        errorMessage: 'unexpected null pointer while mapping canonical transaction',
        retryable: false,
      }),
    );
    expect(syncPersistenceService.registerIntegrationError).not.toHaveBeenCalled();
    expect(syncRejectionRecorder.record).not.toHaveBeenCalled();
    expect(syncConflictRecorder.record).not.toHaveBeenCalled();
  });
});
