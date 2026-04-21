import { PspType } from '../../../shared/domain/enums/pspType';

export type SyncTriggerSource = 'cli';

export type SyncExecutionMode = 'standard' | 'verbose';

export type SyncExecutionContext = {
  syncRunId: string;
  correlationId: string;
  triggeredBy: SyncTriggerSource;
  targetPsp?: PspType;
  startedAt: Date;
  mode: SyncExecutionMode;
  verbose: boolean;
  pageLimit?: number;
  itemLimit?: number;
  dryRun: boolean;
};

export type RunSyncResult = {
  syncRunId: string;
  correlationId: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  mode: SyncExecutionMode;
  targetPsps: PspType[];
  pagesProcessed: number;
  itemsRead: number;
  status: 'completed' | 'failed';
};
