import { appLogger } from '../../../../app/server/logging';
import type { PspSyncStrategy } from '../../../psp/domain/contracts/PspSyncStrategy';
import { PspStrategyFactory } from '../../../psp/infrastructure/factories/PspStrategyFactory';
import { PspType } from '../../../shared/domain/enums/pspType';
import type { RunSyncResult, SyncExecutionContext } from '../dto/SyncExecutionContext';

export class RunSyncUseCase {
  public constructor(private readonly strategyFactory: PspStrategyFactory) {}

  public async execute(context: SyncExecutionContext): Promise<RunSyncResult> {
    const startedAtMs = Date.now();
    const targetPsps = context.targetPsp
      ? [context.targetPsp]
      : [PspType.PAGARME, PspType.MERCADO_PAGO];

    let pagesProcessed = 0;
    let itemsRead = 0;

    appLogger.info({
      eventType: 'sync_run_started',
      message: 'Sync execution started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        triggeredBy: context.triggeredBy,
        targetPsps,
        mode: context.mode,
        pageLimit: context.pageLimit,
        itemLimit: context.itemLimit,
        dryRun: context.dryRun,
      },
    });

    try {
      for (const psp of targetPsps) {
        const strategy = this.strategyFactory.resolve<unknown>(psp);

        const result = await this.executeSingleStrategy(strategy, context);

        pagesProcessed += result.pagesProcessed;
        itemsRead += result.itemsRead;
      }

      const finishedAt = new Date();
      const durationMs = Date.now() - startedAtMs;

      appLogger.info({
        eventType: 'sync_run_completed',
        message: 'Sync execution completed',
        status: 'completed',
        durationMs,
        context: {
          syncRunId: context.syncRunId,
          correlationId: context.correlationId,
          targetPsps,
          pagesProcessed,
          itemsRead,
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
        pagesProcessed,
        itemsRead,
        status: 'completed',
      };
    } catch (error) {
      const durationMs = Date.now() - startedAtMs;

      appLogger.error({
        eventType: 'sync_run_failed',
        message: 'Sync execution failed',
        status: 'failed',
        durationMs,
        context: {
          syncRunId: context.syncRunId,
          correlationId: context.correlationId,
          targetPsps,
          pagesProcessed,
          itemsRead,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : error,
        },
      });

      throw error;
    }
  }

  private async executeSingleStrategy(
    strategy: PspSyncStrategy<unknown>,
    context: SyncExecutionContext,
  ): Promise<{
    pagesProcessed: number;
    itemsRead: number;
  }> {
    const psp = strategy.getPsp();

    appLogger.info({
      eventType: 'sync_source_started',
      message: 'Sync source execution started',
      status: 'started',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        psp,
      },
    });

    const pageResult = await strategy.listPage({
      page: context.targetPsp === PspType.PAGARME ? 1 : undefined,
      size: context.targetPsp === PspType.PAGARME ? (context.itemLimit ?? 20) : undefined,
      offset: psp === PspType.MERCADO_PAGO ? 0 : undefined,
      limit: psp === PspType.MERCADO_PAGO ? (context.itemLimit ?? 20) : undefined,
    });

    const items = context.itemLimit
      ? pageResult.items.slice(0, context.itemLimit)
      : pageResult.items;

    if (!context.dryRun) {
      for (const item of items) {
        strategy.adapt(item);
      }
    }

    appLogger.info({
      eventType: 'sync_source_completed',
      message: 'Sync source execution completed',
      status: 'completed',
      context: {
        syncRunId: context.syncRunId,
        correlationId: context.correlationId,
        psp,
        pagesProcessed: 1,
        itemsRead: items.length,
      },
    });

    return {
      pagesProcessed: 1,
      itemsRead: items.length,
    };
  }
}
