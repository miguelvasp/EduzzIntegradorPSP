import { appLogger } from '../../../../app/server/logging';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import { PspStrategyFactory } from '../../../psp/infrastructure/factories/PspStrategyFactory';
import { PspType } from '../../../shared/domain/enums/pspType';
import { SyncWindowCalculator } from '../../domain/SyncWindowCalculator';
import type { RunSyncResult, SyncExecutionContext } from '../dto/SyncExecutionContext';
import type { SyncCheckpointRepository } from '../ports/SyncCheckpointRepository';
import { SyncPageProcessor } from '../services/SyncPageProcessor';
import { SyncProgressTracker } from '../services/SyncProgressTracker';

export class RunIncrementalSyncUseCase {
  public constructor(
    private readonly strategyFactory: PspStrategyFactory,
    private readonly checkpointRepository: SyncCheckpointRepository,
    private readonly syncWindowCalculator: SyncWindowCalculator,
    private readonly syncPageProcessor: SyncPageProcessor,
    private readonly progressTracker: SyncProgressTracker,
  ) {}

  public async execute(context: SyncExecutionContext): Promise<RunSyncResult> {
    const startedAtMs = Date.now();
    const targetPsps = context.targetPsp
      ? [context.targetPsp]
      : [PspType.PAGARME, PspType.MERCADO_PAGO];

    appLogger.info({
      eventType: 'incremental_sync_started',
      message: 'Incremental sync execution started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        targetPsps,
        pageLimit: context.pageLimit,
        itemLimit: context.itemLimit,
        dryRun: context.dryRun,
      },
    });

    for (const psp of targetPsps) {
      await this.executePsp(context, psp);
    }

    const snapshot = this.progressTracker.getSnapshot();
    const finishedAt = new Date();
    const durationMs = Date.now() - startedAtMs;

    appLogger.info({
      eventType: 'incremental_sync_completed',
      message: 'Incremental sync execution completed',
      status: 'completed',
      durationMs,
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        targetPsps,
        ...snapshot,
      },
    });

    return {
      syncRunId: context.syncRunId,
      correlationId: context.correlationId,
      startedAt: context.startedAt,
      finishedAt,
      durationMs,
      mode: context.mode,
      targetPsps,
      pagesProcessed: snapshot.pagesProcessed,
      itemsRead: snapshot.itemsRead,
      status: 'completed',
    };
  }

  private async executePsp(context: SyncExecutionContext, psp: PspType): Promise<void> {
    const strategy = this.strategyFactory.resolve<unknown>(psp);
    const checkpoint = await this.checkpointRepository.getByPsp(psp);
    const now = new Date();

    const window = this.syncWindowCalculator.calculate({
      now,
      checkpointLastSyncAt: checkpoint?.lastSyncAt,
    });

    this.progressTracker.startPsp(psp);

    appLogger.info({
      eventType: 'incremental_sync_source_started',
      message: 'Incremental sync source started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        psp,
        checkpoint,
        window,
      },
    });

    let currentPage = checkpoint?.page ?? 1;
    let currentOffset = checkpoint?.offset ?? 0;
    let processedPages = 0;
    const pageLimit = context.pageLimit ?? 1;

    while (processedPages < pageLimit) {
      const pageResult = await this.listPage(strategy, psp, {
        page: currentPage,
        offset: currentOffset,
        itemLimit: context.itemLimit,
      });

      this.progressTracker.recordPageProcessed();

      await this.syncPageProcessor.processPage({
        strategy,
        items: pageResult.items,
        context,
        dryRun: context.dryRun,
      });

      processedPages += 1;

      appLogger.info({
        eventType: 'incremental_sync_page_processed',
        message: 'Incremental sync page processed',
        status: 'completed',
        context: {
          syncRunId: context.syncRunId,
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
    }

    await this.checkpointRepository.save({
      psp,
      lastSyncAt: window.to,
      page: psp === PspType.PAGARME ? currentPage : undefined,
      offset: psp === PspType.MERCADO_PAGO ? currentOffset : undefined,
      cursor: checkpoint?.cursor,
      updatedAt: new Date(),
    });

    appLogger.info({
      eventType: 'incremental_sync_source_completed',
      message: 'Incremental sync source completed',
      status: 'completed',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        psp,
        finalPage: currentPage,
        finalOffset: currentOffset,
      },
    });
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
