import { appLogger } from '../../../../app/server/logging';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import type { PspType } from '../../../shared/domain/enums/pspType';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { SyncExecutionContext } from '../dto/SyncExecutionContext';
import { ItemFailureHandler } from './ItemFailureHandler';
import { SyncConflictRecorder } from './SyncConflictRecorder';
import { SyncPersistenceService } from './SyncPersistenceService';
import { SyncProgressTracker } from './SyncProgressTracker';
import { SyncRejectionRecorder } from './SyncRejectionRecorder';

export class SyncPageProcessor {
  private readonly itemFailureHandler: ItemFailureHandler;

  public constructor(
    private readonly progressTracker: SyncProgressTracker,
    private readonly syncPersistenceService?: SyncPersistenceService,
    private readonly syncRejectionRecorder?: SyncRejectionRecorder,
    private readonly syncConflictRecorder?: SyncConflictRecorder,
  ) {
    this.itemFailureHandler = new ItemFailureHandler(
      syncPersistenceService,
      syncRejectionRecorder,
      syncConflictRecorder,
    );
  }

  public async processPage<TExternalItem>(params: {
    strategy: PspSyncStrategy<TExternalItem>;
    items: TExternalItem[];
    context: SyncExecutionContext;
    dryRun: boolean;
    page?: number;
    offset?: number;
    checkpointLastSyncAt?: Date;
  }): Promise<void> {
    for (const item of params.items) {
      this.progressTracker.recordItemRead();

      if (params.dryRun) {
        this.progressTracker.recordItemProcessed();

        appLogger.info({
          eventType: 'transaction_processed',
          message: 'Sync item skipped persistence due to dry run',
          status: 'completed',
          context: PayloadSanitizer.sanitize({
            syncRunId: params.context.syncRunId,
            syncRunDbId: params.context.syncRunDbId,
            correlationId: params.context.correlationId,
            psp: params.strategy.getPsp(),
            dryRun: true,
          }) as Record<string, unknown>,
        });

        continue;
      }

      const extracted = this.extractFailureContext(item, params.strategy.getPsp());
      let syncItemId: number | undefined;

      try {
        if (this.syncPersistenceService) {
          syncItemId = await this.syncPersistenceService.registerIncomingItem({
            syncRunDbId: params.context.syncRunDbId,
            psp: extracted.psp,
            externalId: extracted.externalId,
            resourceType: extracted.resourceType,
            rawPayload: extracted.rawPayload,
          });
        }

        const transaction = params.strategy.adapt(item);

        let decision: 'inserted' | 'updated' | 'processed' = 'processed';

        if (this.syncPersistenceService) {
          const persistenceResult = await this.syncPersistenceService.persistTransaction({
            transaction,
            lastSyncAt: transaction.updatedAt,
            checkpoint: {
              psp: params.strategy.getPsp(),
              page: params.page,
              offset: params.offset,
              lastSyncAt: params.checkpointLastSyncAt ?? transaction.updatedAt,
            },
            syncRunId: params.context.syncRunDbId,
            correlationId: params.context.correlationId,
          });

          decision =
            persistenceResult.decision === 'inserted'
              ? 'inserted'
              : persistenceResult.decision === 'updated'
                ? 'updated'
                : 'processed';

          if (syncItemId) {
            await this.syncPersistenceService.completeIncomingItem({
              syncItemId,
              processingResult: decision,
              transactionId: persistenceResult.transactionId,
            });
          }
        }

        this.progressTracker.recordItemProcessed();

        const externalId = this.tryGetTransactionExternalId(transaction);

        appLogger.info({
          eventType: 'transaction_processed',
          message: 'Sync item processed successfully',
          status: 'completed',
          context: PayloadSanitizer.sanitize({
            syncRunId: params.context.syncRunId,
            syncRunDbId: params.context.syncRunDbId,
            correlationId: params.context.correlationId,
            psp: params.strategy.getPsp(),
            externalId,
            syncItemId,
            decision,
            dryRun: false,
          }) as Record<string, unknown>,
        });
      } catch (error) {
        this.progressTracker.recordItemFailed();

        await this.itemFailureHandler.handle({
          error,
          syncRunDbId: params.context.syncRunDbId,
          correlationId: params.context.correlationId,
          syncItemId,
          item,
          psp: extracted.psp,
          externalId: extracted.externalId,
          resourceType: extracted.resourceType,
          rawPayload: extracted.rawPayload,
        });

        appLogger.error({
          eventType: 'sync_item_failed',
          message: 'Sync item processing failed',
          status: 'failed',
          context: PayloadSanitizer.sanitize({
            syncRunId: params.context.syncRunId,
            syncRunDbId: params.context.syncRunDbId,
            correlationId: params.context.correlationId,
            psp: params.strategy.getPsp(),
            syncItemId,
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

  private extractFailureContext<TExternalItem>(
    item: TExternalItem,
    psp: PspType,
  ): {
    psp: PspType;
    externalId: string;
    resourceType: string;
    rawPayload: unknown;
  } {
    const raw = item as Record<string, unknown>;

    const externalId =
      typeof raw.id === 'string'
        ? raw.id
        : typeof raw.id === 'number'
          ? String(raw.id)
          : typeof raw.code === 'string'
            ? raw.code
            : 'unknown';

    return {
      psp,
      externalId,
      resourceType: 'transaction',
      rawPayload: item,
    };
  }

  private tryGetTransactionExternalId(transaction: unknown): string | undefined {
    if (!transaction || typeof transaction !== 'object') {
      return undefined;
    }

    const candidate = transaction as {
      externalReference?: {
        externalId?: string;
      };
    };

    return candidate.externalReference?.externalId;
  }
}
