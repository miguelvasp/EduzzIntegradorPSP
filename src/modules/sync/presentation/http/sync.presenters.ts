import type { RunSyncResult } from '../../application/dto/SyncExecutionContext';

export class SyncExecutionHttpMapper {
  public map(result: RunSyncResult): Record<string, unknown> {
    return {
      syncRunId: result.syncRunId,
      syncRunDbId: result.syncRunDbId,
      correlationId: result.correlationId,
      status: result.status,
      mode: result.mode,
      targetPsps: result.targetPsps,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      durationMs: result.durationMs,
      pagesProcessed: result.pagesProcessed,
      itemsRead: result.itemsRead,
    };
  }
}
