import type { PspType } from '../../../shared/domain/enums/pspType';
import type { SyncTriggerSource } from '../dto/SyncExecutionContext';

export type SyncRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

export type SyncItemProcessingResult =
  | 'received'
  | 'processed'
  | 'inserted'
  | 'updated'
  | 'ignored'
  | 'rejected'
  | 'conflicted'
  | 'failed';

export type CreateSyncRunInput = {
  sourceName: string;
  triggerType: SyncTriggerSource;
  requestedAt: Date;
  requestedBy?: string;
  startedAt: Date;
  status: SyncRunStatus;
};

export type FinalizeSyncRunInput = {
  syncRunId: number;
  status: SyncRunStatus;
  finishedAt: Date;
  itemsRead: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errorCount: number;
  errorSummary?: string;
};

export type CreateSyncRunSourceInput = {
  syncRunId: number;
  sourceName: string;
  startedAt: Date;
  status: SyncRunStatus;
};

export type FinalizeSyncRunSourceInput = {
  syncRunSourceId: number;
  status: SyncRunStatus;
  finishedAt: Date;
  itemsRead: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
};

export type CreateSyncRunPageInput = {
  syncRunId: number;
  syncRunSourceId?: number;
  pageNumber?: number;
  pageSize?: number;
  cursorValue?: string;
  offsetValue?: number;
  referenceValue?: string;
  startedAt: Date;
  status: SyncRunStatus;
};

export type FinalizeSyncRunPageInput = {
  syncRunPageId: number;
  status: SyncRunStatus;
  finishedAt: Date;
  itemsRead: number;
  itemsProcessed: number;
};

export type CreateSyncItemInput = {
  syncRunId: number;
  syncRunSourceId?: number;
  syncRunPageId?: number;
  psp: PspType;
  externalId: string;
  resourceType: string;
  processingResult: SyncItemProcessingResult;
  transactionId?: number;
  receivedAt: Date;
  processedAt?: Date;
};

export type UpdateSyncItemInput = {
  syncItemId: number;
  processingResult: SyncItemProcessingResult;
  transactionId?: number;
  processedAt?: Date;
};

export type AddRawPayloadInput = {
  syncItemId: number;
  syncRunId: number;
  psp: PspType;
  externalId: string;
  payloadType: string;
  payloadHash: string;
  payloadJson: string;
  sanitizedAt: Date;
};

export type AddIntegrationErrorInput = {
  syncRunId: number;
  syncRunSourceId?: number;
  syncRunPageId?: number;
  syncItemId?: number;
  psp: PspType;
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  retryable: boolean;
  occurredAt: Date;
};

export type AddProcessingErrorInput = {
  syncRunId: number;
  syncItemId?: number;
  transactionId?: number;
  processingStage: string;
  errorCode?: string;
  errorMessage: string;
  retryable: boolean;
  occurredAt: Date;
};

export interface SyncAuditRepository {
  createSyncRun(input: CreateSyncRunInput): Promise<number>;
  finalizeSyncRun(input: FinalizeSyncRunInput): Promise<void>;

  createSyncRunSource(input: CreateSyncRunSourceInput): Promise<number>;
  finalizeSyncRunSource(input: FinalizeSyncRunSourceInput): Promise<void>;

  createSyncRunPage(input: CreateSyncRunPageInput): Promise<number>;
  finalizeSyncRunPage(input: FinalizeSyncRunPageInput): Promise<void>;

  createSyncItem(input: CreateSyncItemInput): Promise<number>;
  updateSyncItem(input: UpdateSyncItemInput): Promise<void>;

  addRawPayload(input: AddRawPayloadInput): Promise<number>;

  addIntegrationError(input: AddIntegrationErrorInput): Promise<number>;
  addProcessingError(input: AddProcessingErrorInput): Promise<number>;
}
