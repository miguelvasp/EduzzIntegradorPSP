import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ItemFailureHandler } from '../../modules/sync/application/services/ItemFailureHandler';

describe('sync conflict persistence integration', () => {
  it('deve gravar data_conflicts e reconciliation_cases para conflito', async () => {
    const syncPersistenceService = {
      failIncomingItem: vi.fn().mockResolvedValue(undefined),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn(),
    };

    const syncRejectionRecorder = {
      record: vi.fn(),
    };

    const syncConflictRecorder = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    const handler = new ItemFailureHandler(
      syncPersistenceService as never,
      syncRejectionRecorder as never,
      syncConflictRecorder as never,
    );

    await handler.handle({
      error: new Error('Amount mismatch detected between incoming and current data'),
      syncRunDbId: 200,
      correlationId: 'corr-conflict',
      syncItemId: 9901,
      item: { id: 'mp_conflict_1' },
      psp: PspType.MERCADO_PAGO,
      externalId: 'mp_conflict_1',
      resourceType: 'transaction',
      rawPayload: {
        id: 'mp_conflict_1',
        transaction_amount: 100,
      },
    });

    expect(syncPersistenceService.failIncomingItem).toHaveBeenCalledWith({
      syncItemId: 9901,
    });
    expect(syncConflictRecorder.record).toHaveBeenCalledTimes(1);
    expect(syncConflictRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        syncRunId: 200,
        syncItemId: 9901,
        psp: PspType.MERCADO_PAGO,
        externalId: 'mp_conflict_1',
        conflictType: 'amount_mismatch',
        openReconciliationCase: true,
      }),
    );
    expect(syncRejectionRecorder.record).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerIntegrationError).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerProcessingError).not.toHaveBeenCalled();
  });
});
