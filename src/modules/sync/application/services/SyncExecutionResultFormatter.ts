import type { RunSyncResult } from '../dto/SyncExecutionContext';

export class SyncExecutionResultFormatter {
  public static toConsoleOutput(result: RunSyncResult): string {
    return JSON.stringify(
      {
        syncRunId: result.syncRunId,
        correlationId: result.correlationId,
        status: result.status,
        mode: result.mode,
        targetPsps: result.targetPsps,
        startedAt: result.startedAt,
        finishedAt: result.finishedAt,
        durationMs: result.durationMs,
        pagesProcessed: result.pagesProcessed,
        itemsRead: result.itemsRead,
      },
      null,
      2,
    );
  }
}
