import { appLogger } from '../../../../app/server/logging';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { SyncExecutionContext } from '../dto/SyncExecutionContext';
import { SyncProgressTracker } from './SyncProgressTracker';

export class SyncPageProcessor {
  public constructor(private readonly progressTracker: SyncProgressTracker) {}

  public async processPage<TExternalItem>(params: {
    strategy: PspSyncStrategy<TExternalItem>;
    items: TExternalItem[];
    context: SyncExecutionContext;
    dryRun: boolean;
  }): Promise<void> {
    for (const item of params.items) {
      this.progressTracker.recordItemRead();

      try {
        if (!params.dryRun) {
          params.strategy.adapt(item);
        }

        this.progressTracker.recordItemProcessed();
      } catch (error) {
        this.progressTracker.recordItemFailed();

        appLogger.error({
          eventType: 'sync_item_failed',
          message: 'Sync item processing failed',
          status: 'failed',
          context: PayloadSanitizer.sanitize({
            syncRunId: params.context.syncRunId,
            correlationId: params.context.correlationId,
            psp: params.strategy.getPsp(),
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                  }
                : error,
          }) as Record<string, unknown>,
        });
      }
    }
  }
}
