import { randomUUID } from 'node:crypto';
import type { PspType } from '../../../shared/domain/enums/pspType';
import type { SyncExecutionContext, SyncTriggerSource } from '../dto/SyncExecutionContext';

export type CreateSyncExecutionContextInput = {
  correlationId?: string;
  targetPsp?: PspType;
  triggeredBy?: SyncTriggerSource;
  mode?: SyncExecutionContext['mode'];
  verbose?: boolean;
  pageLimit?: number;
  itemLimit?: number;
  dryRun?: boolean;
};

export class SyncExecutionFactory {
  public create(input: CreateSyncExecutionContextInput): SyncExecutionContext {
    return {
      syncRunId: randomUUID(),
      correlationId: input.correlationId ?? randomUUID(),
      triggeredBy: input.triggeredBy ?? 'cli',
      targetPsp: input.targetPsp,
      startedAt: new Date(),
      mode: input.mode ?? 'standard',
      verbose: input.verbose ?? false,
      pageLimit: input.pageLimit,
      itemLimit: input.itemLimit,
      dryRun: input.dryRun ?? false,
    };
  }
}
