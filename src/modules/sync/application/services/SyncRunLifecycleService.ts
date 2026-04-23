import { PspType } from '../../../shared/domain/enums/pspType';
import type { SyncExecutionContext } from '../dto/SyncExecutionContext';
import type { SyncAuditRepository, SyncRunStatus } from '../ports/SyncAuditRepository';
import type { SyncProgressSnapshot } from './SyncProgressTracker';

type SourceCounters = {
  itemsRead: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
};

type PageCounters = {
  itemsRead: number;
  itemsProcessed: number;
};

export class SyncRunLifecycleService {
  public constructor(
    private readonly syncAuditRepository: SyncAuditRepository,
    private readonly sourceName = 'multi_psp_transaction_sync',
  ) {}

  public async startRun(context: SyncExecutionContext): Promise<SyncExecutionContext> {
    const syncRunDbId = await this.syncAuditRepository.createSyncRun({
      sourceName: this.sourceName,
      triggerType: context.triggeredBy,
      requestedAt: context.startedAt,
      requestedBy: context.triggeredBy,
      startedAt: context.startedAt,
      status: 'running',
    });

    return {
      ...context,
      syncRunDbId,
    };
  }

  public async completeRun(params: {
    context: SyncExecutionContext;
    snapshot: SyncProgressSnapshot;
    status: SyncRunStatus;
    errorSummary?: string;
  }): Promise<void> {
    if (!params.context.syncRunDbId) {
      return;
    }

    await this.syncAuditRepository.finalizeSyncRun({
      syncRunId: params.context.syncRunDbId,
      status: params.status,
      finishedAt: new Date(),
      itemsRead: params.snapshot.itemsRead,
      itemsProcessed: params.snapshot.itemsProcessed + params.snapshot.itemsFailed,
      itemsSucceeded: params.snapshot.itemsProcessed,
      itemsFailed: params.snapshot.itemsFailed,
      errorCount: params.snapshot.itemsFailed,
      errorSummary: params.errorSummary,
    });
  }

  public async startSource(params: {
    context: SyncExecutionContext;
    psp: PspType;
  }): Promise<number | undefined> {
    if (!params.context.syncRunDbId) {
      return undefined;
    }

    return this.syncAuditRepository.createSyncRunSource({
      syncRunId: params.context.syncRunDbId,
      sourceName: params.psp,
      startedAt: new Date(),
      status: 'running',
    });
  }

  public async completeSource(params: {
    syncRunSourceId?: number;
    status: SyncRunStatus;
    counters: SourceCounters;
  }): Promise<void> {
    if (!params.syncRunSourceId) {
      return;
    }

    await this.syncAuditRepository.finalizeSyncRunSource({
      syncRunSourceId: params.syncRunSourceId,
      status: params.status,
      finishedAt: new Date(),
      itemsRead: params.counters.itemsRead,
      itemsProcessed: params.counters.itemsProcessed,
      itemsSucceeded: params.counters.itemsSucceeded,
      itemsFailed: params.counters.itemsFailed,
    });
  }

  public async startPage(params: {
    context: SyncExecutionContext;
    syncRunSourceId?: number;
    pageNumber?: number;
    pageSize?: number;
    offsetValue?: number;
    cursorValue?: string;
    referenceValue?: string;
  }): Promise<number | undefined> {
    if (!params.context.syncRunDbId) {
      return undefined;
    }

    return this.syncAuditRepository.createSyncRunPage({
      syncRunId: params.context.syncRunDbId,
      syncRunSourceId: params.syncRunSourceId,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      cursorValue: params.cursorValue,
      offsetValue: params.offsetValue,
      referenceValue: params.referenceValue,
      startedAt: new Date(),
      status: 'running',
    });
  }

  public async completePage(params: {
    syncRunPageId?: number;
    status: SyncRunStatus;
    counters: PageCounters;
  }): Promise<void> {
    if (!params.syncRunPageId) {
      return;
    }

    await this.syncAuditRepository.finalizeSyncRunPage({
      syncRunPageId: params.syncRunPageId,
      status: params.status,
      finishedAt: new Date(),
      itemsRead: params.counters.itemsRead,
      itemsProcessed: params.counters.itemsProcessed,
    });
  }

  public calculateSourceCounters(
    before: SyncProgressSnapshot,
    after: SyncProgressSnapshot,
  ): SourceCounters {
    const itemsSucceeded = after.itemsProcessed - before.itemsProcessed;
    const itemsFailed = after.itemsFailed - before.itemsFailed;

    return {
      itemsRead: after.itemsRead - before.itemsRead,
      itemsProcessed: itemsSucceeded + itemsFailed,
      itemsSucceeded,
      itemsFailed,
    };
  }

  public calculatePageCounters(
    before: SyncProgressSnapshot,
    after: SyncProgressSnapshot,
  ): PageCounters {
    const itemsSucceeded = after.itemsProcessed - before.itemsProcessed;
    const itemsFailed = after.itemsFailed - before.itemsFailed;

    return {
      itemsRead: after.itemsRead - before.itemsRead,
      itemsProcessed: itemsSucceeded + itemsFailed,
    };
  }
}
