import type { PspType } from '../../../modules/shared/domain/enums/pspType';
import type { SyncProgressSnapshot } from '../../../modules/sync/application/services/SyncProgressTracker';
import { appLogger } from '../logging';

export type OperationalSummaryParams = {
  eventType: 'sync_operational_summary' | 'incremental_sync_operational_summary';
  message: string;
  status: 'completed' | 'failed';
  syncRunId: string;
  correlationId: string;
  targetPsps: PspType[];
  durationMs: number;
  snapshot: SyncProgressSnapshot;
  rejectedCount?: number;
  conflictedCount?: number;
  integrationErrorCount?: number;
  processingErrorCount?: number;
};

export function logOperationalSummary(params: OperationalSummaryParams): void {
  appLogger.info({
    eventType: params.eventType,
    message: params.message,
    status: params.status,
    durationMs: params.durationMs,
    context: {
      syncRunId: params.syncRunId,
      correlationId: params.correlationId,
      targetPsps: params.targetPsps,
      currentPsp: params.snapshot.currentPsp,
      pagesProcessed: params.snapshot.pagesProcessed,
      itemsRead: params.snapshot.itemsRead,
      itemsProcessed: params.snapshot.itemsProcessed,
      itemsSucceeded: params.snapshot.itemsProcessed,
      itemsFailed: params.snapshot.itemsFailed,
      rejectedCount: params.rejectedCount ?? 0,
      conflictedCount: params.conflictedCount ?? 0,
      integrationErrorCount: params.integrationErrorCount ?? 0,
      processingErrorCount: params.processingErrorCount ?? 0,
    },
  });
}
