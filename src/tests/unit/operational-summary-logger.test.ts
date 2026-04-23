import { afterEach, describe, expect, it, vi } from 'vitest';
import { appLogger } from '../../app/server/logging';
import { logOperationalSummary } from '../../app/server/logging/operationalSummaryLogger';
import { PspType } from '../../modules/shared/domain/enums/pspType';

describe('operationalSummaryLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve logar resumo operacional com contadores padronizados', () => {
    const infoSpy = vi.spyOn(appLogger, 'info').mockImplementation(() => undefined);

    logOperationalSummary({
      eventType: 'sync_operational_summary',
      message: 'Sync operational summary',
      status: 'completed',
      syncRunId: 'sync-run-123',
      correlationId: 'corr-456',
      targetPsps: [PspType.PAGARME],
      durationMs: 180,
      snapshot: {
        currentPsp: PspType.PAGARME,
        pagesProcessed: 1,
        itemsRead: 4,
        itemsProcessed: 3,
        itemsFailed: 1,
      },
      rejectedCount: 1,
      conflictedCount: 1,
      integrationErrorCount: 0,
      processingErrorCount: 1,
    });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'sync_operational_summary',
        message: 'Sync operational summary',
        status: 'completed',
        durationMs: 180,
        context: expect.objectContaining({
          syncRunId: 'sync-run-123',
          correlationId: 'corr-456',
          targetPsps: [PspType.PAGARME],
          currentPsp: PspType.PAGARME,
          pagesProcessed: 1,
          itemsRead: 4,
          itemsProcessed: 3,
          itemsSucceeded: 3,
          itemsFailed: 1,
          rejectedCount: 1,
          conflictedCount: 1,
          integrationErrorCount: 0,
          processingErrorCount: 1,
        }),
      }),
    );
  });
});
