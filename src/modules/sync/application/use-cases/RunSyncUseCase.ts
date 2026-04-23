import { appLogger } from '../../../../app/server/logging';
import { logOperationalSummary } from '../../../../app/server/logging/operationalSummaryLogger';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import { PspStrategyFactory } from '../../../psp/infrastructure/factories/PspStrategyFactory';
import { PspType } from '../../../shared/domain/enums/pspType';
import type { RunSyncResult, SyncExecutionContext } from '../dto/SyncExecutionContext';
import { SyncPageProcessor } from '../services/SyncPageProcessor';
import { SyncProgressTracker } from '../services/SyncProgressTracker';
import { SyncRunLifecycleService } from '../services/SyncRunLifecycleService';

export class RunSyncUseCase {
  public constructor(
    private readonly strategyFactory: PspStrategyFactory,
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
      eventType: 'sync_run_started',
      message: 'Sync execution started',
      status: 'started',
      context: {
        syncRunId: executionContext.syncRunId,
        syncRunDbId: executionContext.syncRunDbId,
        correlationId: executionContext.correlationId,
        triggeredBy: executionContext.triggeredBy,
        targetPsps,
        mode: executionContext.mode,
        pageLimit: executionContext.pageLimit,
        itemLimit: executionContext.itemLimit,
        dryRun: executionContext.dryRun,
      },
    });

    try {
      for (const psp of targetPsps) {
        const strategy = this.strategyFactory.resolve<unknown>(psp);

        await this.executeSingleStrategy(strategy, executionContext);
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
        eventType: 'sync_run_completed',
        message: 'Sync execution completed',
        status: 'completed',
        durationMs,
        context: {
          syncRunId: executionContext.syncRunId,
          syncRunDbId: executionContext.syncRunDbId,
          correlationId: executionContext.correlationId,
          targetPsps,
          pagesProcessed: snapshot.pagesProcessed,
          itemsRead: snapshot.itemsRead,
        },
      });

      logOperationalSummary({
        eventType: 'sync_operational_summary',
        message: 'Sync operational summary',
        status: 'completed',
        syncRunId: executionContext.syncRunId,
        correlationId: executionContext.correlationId,
        targetPsps,
        durationMs,
        snapshot,
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
      const durationMs = Date.now() - startedAtMs;
      const errorSummary =
        error instanceof Error ? error.message : 'Unknown sync execution failure';

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completeRun({
          context: executionContext,
          snapshot,
          status: 'failed',
          errorSummary,
        });
      }

      appLogger.error({
        eventType: 'sync_run_failed',
        message: 'Sync execution failed',
        status: 'failed',
        durationMs,
        context: {
          syncRunId: executionContext.syncRunId,
          syncRunDbId: executionContext.syncRunDbId,
          correlationId: executionContext.correlationId,
          targetPsps,
          pagesProcessed: snapshot.pagesProcessed,
          itemsRead: snapshot.itemsRead,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        },
      });

      logOperationalSummary({
        eventType: 'sync_operational_summary',
        message: 'Sync operational summary',
        status: 'failed',
        syncRunId: executionContext.syncRunId,
        correlationId: executionContext.correlationId,
        targetPsps,
        durationMs,
        snapshot,
      });

      throw error;
    }
  }

  private async executeSingleStrategy(
    strategy: PspSyncStrategy<unknown>,
    context: SyncExecutionContext,
  ): Promise<void> {
    const psp = strategy.getPsp();
    const sourceSnapshotBefore = this.progressTracker.getSnapshot();
    let syncRunSourceId: number | undefined;
    let syncRunPageId: number | undefined;
    let pageSnapshotBefore = this.progressTracker.getSnapshot();

    this.progressTracker.startPsp(psp);

    appLogger.info({
      eventType: 'sync_source_started',
      message: 'Sync source execution started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        syncRunDbId: context.syncRunDbId,
        correlationId: context.correlationId,
        psp,
      },
    });

    try {
      if (this.syncRunLifecycleService) {
        syncRunSourceId = await this.syncRunLifecycleService.startSource({
          context,
          psp,
        });
      }

      const pageResult = await strategy.listPage({
        page: psp === PspType.PAGARME ? 1 : undefined,
        size: psp === PspType.PAGARME ? (context.itemLimit ?? 20) : undefined,
        offset: psp === PspType.MERCADO_PAGO ? 0 : undefined,
        limit: psp === PspType.MERCADO_PAGO ? (context.itemLimit ?? 20) : undefined,
      });

      const items = context.itemLimit
        ? pageResult.items.slice(0, context.itemLimit)
        : pageResult.items;

      pageSnapshotBefore = this.progressTracker.getSnapshot();

      if (this.syncRunLifecycleService) {
        syncRunPageId = await this.syncRunLifecycleService.startPage({
          context,
          syncRunSourceId,
          pageNumber: psp === PspType.PAGARME ? 1 : undefined,
          pageSize: context.itemLimit ?? items.length,
          offsetValue: psp === PspType.MERCADO_PAGO ? 0 : undefined,
          referenceValue: psp,
        });
      }

      this.progressTracker.recordPageProcessed();

      await this.syncPageProcessor.processPage({
        strategy,
        items,
        context,
        dryRun: context.dryRun,
      });

      const pageSnapshotAfter = this.progressTracker.getSnapshot();
      const sourceSnapshotAfter = this.progressTracker.getSnapshot();

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completePage({
          syncRunPageId,
          status: 'completed',
          counters: this.syncRunLifecycleService.calculatePageCounters(
            pageSnapshotBefore,
            pageSnapshotAfter,
          ),
        });

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
        eventType: 'sync_source_completed',
        message: 'Sync source execution completed',
        status: 'completed',
        context: {
          syncRunId: context.syncRunId,
          syncRunDbId: context.syncRunDbId,
          correlationId: context.correlationId,
          psp,
          pagesProcessed: 1,
          itemsRead: items.length,
        },
      });
    } catch (error) {
      const pageSnapshotAfter = this.progressTracker.getSnapshot();
      const sourceSnapshotAfter = this.progressTracker.getSnapshot();

      if (this.syncRunLifecycleService) {
        await this.syncRunLifecycleService.completePage({
          syncRunPageId,
          status: 'failed',
          counters: this.syncRunLifecycleService.calculatePageCounters(
            pageSnapshotBefore,
            pageSnapshotAfter,
          ),
        });

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
}
