import { appLogger } from '../../../../app/server/logging';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import { PspStrategyFactory } from '../../../psp/infrastructure/factories/PspStrategyFactory';
import { PspType } from '../../../shared/domain/enums/pspType';
import { SyncWindowCalculator } from '../../domain/SyncWindowCalculator';
import type { RunSyncResult, SyncExecutionContext } from '../dto/SyncExecutionContext';
import type { SyncCheckpointRepository } from '../ports/SyncCheckpointRepository';
import { SyncPageProcessor } from '../services/SyncPageProcessor';
import { SyncPersistenceMapper } from '../services/SyncPersistenceMapper';
import { SyncProgressTracker } from '../services/SyncProgressTracker';
import { SyncRunLifecycleService } from '../services/SyncRunLifecycleService';

export class RunIncrementalSyncUseCase {
  public constructor(
    private readonly strategyFactory: PspStrategyFactory,
    private readonly checkpointRepository: SyncCheckpointRepository,
    private readonly syncWindowCalculator: SyncWindowCalculator,
    private readonly syncPageProcessor: SyncPageProcessor,
    private readonly progressTracker: SyncProgressTracker,
    private readonly syncRunLifecycleService?: SyncRunLifecycleService,
  ) {}

  public async execute(context: SyncExecutionContext): Promise<RunSyncResult> {
    const startedAtMs = Date.now();
    const targetPsps = context.targetPsp
      ? [context.targetPsp]
      : [PspType.PAGARME, PspType.MERCADO_PAGO];

    const executionContext = this.syncRunLifecycleService
      ? await this.syncRunLifecycleService.startRun(context)
      : context;

    appLogger.info({
      eventType: 'incremental_sync_started',
      message: 'Incremental sync execution started',
      status: 'started',
      context: {
        syncRunId: executionContext.syncRunId,
        syncRunDbId: executionContext.syncRunDbId,
        correlationId: executionContext.correlationId,
        targetPsps,
        pageLimit: executionContext.pageLimit,
        itemLimit: executionContext.itemLimit,
        dryRun: executionContext.dryRun,
      },
    });

    try {
      for (const psp of targetPsps) {
        await this.executePsp(executionContext, psp);
      }

      const snapshot = this.progressTracker.getSnapshot();
      const finishedAt = new Date();
      const durationMs = Date.now() - startedAtMs;

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completeRun({
          context: executionContext,
          snapshot,
          status: 'completed',
        });
      }

      appLogger.info({
        eventType: 'incremental_sync_completed',
        message: 'Incremental sync execution completed',
        status: 'completed',
        durationMs,
        context: {
          syncRunId: executionContext.syncRunId,
          syncRunDbId: executionContext.syncRunDbId,
          correlationId: executionContext.correlationId,
          targetPsps,
          ...snapshot,
        },
      });

      return {
        syncRunId: executionContext.syncRunId,
        syncRunDbId: executionContext.syncRunDbId,
        correlationId: executionContext.correlationId,
        startedAt: executionContext.startedAt,
        finishedAt,
        durationMs,
        mode: executionContext.mode,
        targetPsps,
        pagesProcessed: snapshot.pagesProcessed,
        itemsRead: snapshot.itemsRead,
        status: 'completed',
      };
    } catch (error) {
      const snapshot = this.progressTracker.getSnapshot();
      const errorSummary =
        error instanceof Error ? error.message : 'Unknown incremental sync execution failure';

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completeRun({
          context: executionContext,
          snapshot,
          status: 'failed',
          errorSummary,
        });
      }

      throw error;
    }
  }

  private async executePsp(context: SyncExecutionContext, psp: PspType): Promise<void> {
    const strategy = this.strategyFactory.resolve<unknown>(psp);
    const checkpoint = await this.checkpointRepository.getByPsp(psp);
    const now = new Date();

    const window = this.syncWindowCalculator.calculate({
      now,
      checkpointLastSyncAt: checkpoint?.lastSyncAt,
    });

    const sourceSnapshotBefore = this.progressTracker.getSnapshot();
    let syncRunSourceId: number | undefined;

    this.progressTracker.startPsp(psp);

    appLogger.info({
      eventType: 'incremental_sync_source_started',
      message: 'Incremental sync source started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        syncRunDbId: context.syncRunDbId,
        correlationId: context.correlationId,
        psp,
        checkpoint,
        window,
      },
    });

    let currentPage = checkpoint?.page ?? 1;
    let currentOffset = checkpoint?.offset ?? 0;
    const currentCursor = checkpoint?.cursor;
    let processedPages = 0;
    const pageLimit = context.pageLimit ?? 1;

    try {
      if (this.syncRunLifecycleService) {
        syncRunSourceId = await this.syncRunLifecycleService.startSource({
          context,
          psp,
        });
      }

      while (processedPages < pageLimit) {
        const pageResult = await this.listPage(strategy, psp, {
          page: currentPage,
          offset: currentOffset,
          itemLimit: context.itemLimit,
        });

        const pageSnapshotBefore = this.progressTracker.getSnapshot();
        let syncRunPageId: number | undefined;

        if (this.syncRunLifecycleService) {
          syncRunPageId = await this.syncRunLifecycleService.startPage({
            context,
            syncRunSourceId,
            pageNumber: psp === PspType.PAGARME ? currentPage : undefined,
            pageSize: context.itemLimit ?? pageResult.items.length,
            offsetValue: psp === PspType.MERCADO_PAGO ? currentOffset : undefined,
            referenceValue: psp,
          });
        }

        try {
          this.progressTracker.recordPageProcessed();

          await this.syncPageProcessor.processPage({
            strategy,
            items: pageResult.items,
            context,
            dryRun: context.dryRun,
            page: psp === PspType.PAGARME ? currentPage : undefined,
            offset: psp === PspType.MERCADO_PAGO ? currentOffset : undefined,
            checkpointLastSyncAt: window.to,
          });

          processedPages += 1;

          const pageSnapshotAfter = this.progressTracker.getSnapshot();

          if (this.syncRunLifecycleService) {
            await this.syncRunLifecycleService.completePage({
              syncRunPageId,
              status: 'completed',
              counters: this.syncRunLifecycleService.calculatePageCounters(
                pageSnapshotBefore,
                pageSnapshotAfter,
              ),
            });
          }

          appLogger.info({
            eventType: 'incremental_sync_page_processed',
            message: 'Incremental sync page processed',
            status: 'completed',
            context: {
              syncRunId: context.syncRunId,
              syncRunDbId: context.syncRunDbId,
              correlationId: context.correlationId,
              psp,
              page: currentPage,
              offset: currentOffset,
              itemCount: pageResult.items.length,
              hasMore: pageResult.pagination.hasMore ?? false,
            },
          });

          if (!pageResult.pagination.hasMore) {
            break;
          }

          if (psp === PspType.PAGARME) {
            currentPage += 1;
          }

          if (psp === PspType.MERCADO_PAGO) {
            currentOffset += pageResult.pagination.limit ?? pageResult.items.length;
          }
        } catch (error) {
          const pageSnapshotAfter = this.progressTracker.getSnapshot();

          if (this.syncRunLifecycleService) {
            await this.syncRunLifecycleService.completePage({
              syncRunPageId,
              status: 'failed',
              counters: this.syncRunLifecycleService.calculatePageCounters(
                pageSnapshotBefore,
                pageSnapshotAfter,
              ),
            });
          }

          throw error;
        }
      }

      await this.checkpointRepository.save(
        SyncPersistenceMapper.toCheckpoint({
          psp,
          lastSyncAt: window.to,
          page: psp === PspType.PAGARME ? currentPage : undefined,
          offset: psp === PspType.MERCADO_PAGO ? currentOffset : undefined,
          cursor: currentCursor,
          updatedAt: new Date(),
        }),
      );

      const sourceSnapshotAfter = this.progressTracker.getSnapshot();

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completeSource({
          syncRunSourceId,
          status: 'completed',
          counters: this.syncRunLifecycleService.calculateSourceCounters(
            sourceSnapshotBefore,
            sourceSnapshotAfter,
          ),
        });
      }

      appLogger.info({
        eventType: 'incremental_sync_source_completed',
        message: 'Incremental sync source completed',
        status: 'completed',
        context: {
          syncRunId: context.syncRunId,
          syncRunDbId: context.syncRunDbId,
          correlationId: context.correlationId,
          psp,
          finalPage: currentPage,
          finalOffset: currentOffset,
        },
      });
    } catch (error) {
      const sourceSnapshotAfter = this.progressTracker.getSnapshot();

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completeSource({
          syncRunSourceId,
          status: 'failed',
          counters: this.syncRunLifecycleService.calculateSourceCounters(
            sourceSnapshotBefore,
            sourceSnapshotAfter,
          ),
        });
      }

      throw error;
    }
  }

  private async listPage(
    strategy: PspSyncStrategy<unknown>,
    psp: PspType,
    params: {
      page: number;
      offset: number;
      itemLimit?: number;
    },
  ) {
    if (psp === PspType.PAGARME) {
      return strategy.listPage({
        page: params.page,
        size: params.itemLimit ?? 20,
      });
    }

    return strategy.listPage({
      offset: params.offset,
      limit: params.itemLimit ?? 20,
    });
  }
}
