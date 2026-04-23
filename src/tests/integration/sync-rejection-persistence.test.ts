import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ItemFailureHandler } from '../../modules/sync/application/services/ItemFailureHandler';

describe('sync rejection persistence integration', () => {
  it('deve gravar validation_failures e rejected_records para rejeição de negócio', async () => {
    const syncPersistenceService = {
      failIncomingItem: vi.fn().mockResolvedValue(undefined),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn(),
    };

    const syncRejectionRecorder = {
      record: vi.fn().mockResolvedValue(undefined),
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
      error: new Error('Missing payer data'),
      syncRunDbId: 100,
      correlationId: 'corr-rejection',
      syncItemId: 9001,
      item: { id: 'or_rejected_1' },
      psp: PspType.PAGARME,
      externalId: 'or_rejected_1',
      resourceType: 'transaction',
      rawPayload: {
        id: 'or_rejected_1',
      },
    });

    expect(syncPersistenceService.failIncomingItem).toHaveBeenCalledWith({
      syncItemId: 9001,
    });
    expect(syncRejectionRecorder.record).toHaveBeenCalledTimes(1);
    expect(syncRejectionRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        syncRunId: 100,
        syncItemId: 9001,
        psp: PspType.PAGARME,
        externalId: 'or_rejected_1',
        rejectionType: 'rejected_missing_payer',
        rejectionReason: 'Missing payer data',
        validationFailureType: 'missing_payer',
        validationFailureMessage: 'Missing payer data',
      }),
    );
    expect(syncConflictRecorder.record).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerIntegrationError).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerProcessingError).not.toHaveBeenCalled();
  });
});
