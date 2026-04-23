import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type {
  AddIntegrationErrorInput,
  AddProcessingErrorInput,
  AddRawPayloadInput,
  CreateSyncItemInput,
  CreateSyncRunInput,
  CreateSyncRunPageInput,
  CreateSyncRunSourceInput,
  FinalizeSyncRunInput,
  FinalizeSyncRunPageInput,
  FinalizeSyncRunSourceInput,
  SyncAuditRepository,
  UpdateSyncItemInput,
} from '../../../application/ports/SyncAuditRepository';

type InsertedIdRow = {
  id: number;
};

export class SqlServerSyncAuditRepository implements SyncAuditRepository {
  public async createSyncRun(input: CreateSyncRunInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('sourceName', sql.NVarChar(50), input.sourceName)
      .input('triggerType', sql.NVarChar(30), input.triggerType)
      .input('status', sql.NVarChar(30), input.status)
      .input('requestedAt', sql.DateTime2, input.requestedAt)
      .input('requestedBy', sql.NVarChar(100), input.requestedBy ?? null)
      .input('startedAt', sql.DateTime2, input.startedAt).query<InsertedIdRow>(`
        INSERT INTO dbo.sync_runs
        (
          source_name,
          trigger_type,
          status,
          requested_at,
          requested_by,
          started_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @sourceName,
          @triggerType,
          @status,
          @requestedAt,
          @requestedBy,
          @startedAt
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async finalizeSyncRun(input: FinalizeSyncRunInput): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('status', sql.NVarChar(30), input.status)
      .input('finishedAt', sql.DateTime2, input.finishedAt)
      .input('itemsRead', sql.Int, input.itemsRead)
      .input('itemsProcessed', sql.Int, input.itemsProcessed)
      .input('itemsSucceeded', sql.Int, input.itemsSucceeded)
      .input('itemsFailed', sql.Int, input.itemsFailed)
      .input('errorCount', sql.Int, input.errorCount)
      .input('errorSummary', sql.NVarChar(1000), input.errorSummary ?? null).query(`
        UPDATE dbo.sync_runs
        SET
          status = @status,
          finished_at = @finishedAt,
          items_read = @itemsRead,
          items_processed = @itemsProcessed,
          items_succeeded = @itemsSucceeded,
          items_failed = @itemsFailed,
          error_count = @errorCount,
          error_summary = @errorSummary
        WHERE id = @syncRunId
      `);
  }

  public async createSyncRunSource(input: CreateSyncRunSourceInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('sourceName', sql.NVarChar(50), input.sourceName)
      .input('status', sql.NVarChar(30), input.status)
      .input('startedAt', sql.DateTime2, input.startedAt).query<InsertedIdRow>(`
        INSERT INTO dbo.sync_run_sources
        (
          sync_run_id,
          source_name,
          status,
          started_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncRunId,
          @sourceName,
          @status,
          @startedAt
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async finalizeSyncRunSource(input: FinalizeSyncRunSourceInput): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('syncRunSourceId', sql.BigInt, input.syncRunSourceId)
      .input('status', sql.NVarChar(30), input.status)
      .input('finishedAt', sql.DateTime2, input.finishedAt)
      .input('itemsRead', sql.Int, input.itemsRead)
      .input('itemsProcessed', sql.Int, input.itemsProcessed)
      .input('itemsSucceeded', sql.Int, input.itemsSucceeded)
      .input('itemsFailed', sql.Int, input.itemsFailed).query(`
        UPDATE dbo.sync_run_sources
        SET
          status = @status,
          finished_at = @finishedAt,
          items_read = @itemsRead,
          items_processed = @itemsProcessed,
          items_succeeded = @itemsSucceeded,
          items_failed = @itemsFailed
        WHERE id = @syncRunSourceId
      `);
  }

  public async createSyncRunPage(input: CreateSyncRunPageInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('syncRunSourceId', sql.BigInt, input.syncRunSourceId ?? null)
      .input('pageNumber', sql.Int, input.pageNumber ?? null)
      .input('pageSize', sql.Int, input.pageSize ?? null)
      .input('cursorValue', sql.NVarChar(200), input.cursorValue ?? null)
      .input('offsetValue', sql.Int, input.offsetValue ?? null)
      .input('referenceValue', sql.NVarChar(200), input.referenceValue ?? null)
      .input('startedAt', sql.DateTime2, input.startedAt)
      .input('status', sql.NVarChar(30), input.status).query<InsertedIdRow>(`
        INSERT INTO dbo.sync_run_pages
        (
          sync_run_id,
          sync_run_source_id,
          page_number,
          page_size,
          cursor_value,
          offset_value,
          reference_value,
          started_at,
          status
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncRunId,
          @syncRunSourceId,
          @pageNumber,
          @pageSize,
          @cursorValue,
          @offsetValue,
          @referenceValue,
          @startedAt,
          @status
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async finalizeSyncRunPage(input: FinalizeSyncRunPageInput): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('syncRunPageId', sql.BigInt, input.syncRunPageId)
      .input('status', sql.NVarChar(30), input.status)
      .input('finishedAt', sql.DateTime2, input.finishedAt)
      .input('itemsRead', sql.Int, input.itemsRead)
      .input('itemsProcessed', sql.Int, input.itemsProcessed).query(`
        UPDATE dbo.sync_run_pages
        SET
          status = @status,
          finished_at = @finishedAt,
          items_read = @itemsRead,
          items_processed = @itemsProcessed
        WHERE id = @syncRunPageId
      `);
  }

  public async createSyncItem(input: CreateSyncItemInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('syncRunSourceId', sql.BigInt, input.syncRunSourceId ?? null)
      .input('syncRunPageId', sql.BigInt, input.syncRunPageId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('resourceType', sql.NVarChar(50), input.resourceType)
      .input('processingResult', sql.NVarChar(30), input.processingResult)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('receivedAt', sql.DateTime2, input.receivedAt)
      .input('processedAt', sql.DateTime2, input.processedAt ?? null).query<InsertedIdRow>(`
        INSERT INTO dbo.sync_items
        (
          sync_run_id,
          sync_run_source_id,
          sync_run_page_id,
          psp,
          external_id,
          resource_type,
          processing_result,
          transaction_id,
          received_at,
          processed_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncRunId,
          @syncRunSourceId,
          @syncRunPageId,
          @psp,
          @externalId,
          @resourceType,
          @processingResult,
          @transactionId,
          @receivedAt,
          @processedAt
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async updateSyncItem(input: UpdateSyncItemInput): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('syncItemId', sql.BigInt, input.syncItemId)
      .input('processingResult', sql.NVarChar(30), input.processingResult)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('processedAt', sql.DateTime2, input.processedAt ?? null).query(`
        UPDATE dbo.sync_items
        SET
          processing_result = @processingResult,
          transaction_id = @transactionId,
          processed_at = @processedAt
        WHERE id = @syncItemId
      `);
  }

  public async addRawPayload(input: AddRawPayloadInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncItemId', sql.BigInt, input.syncItemId)
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('payloadType', sql.NVarChar(50), input.payloadType)
      .input('payloadHash', sql.Char(64), input.payloadHash)
      .input('payloadJson', sql.NVarChar(sql.MAX), input.payloadJson)
      .input('sanitizedAt', sql.DateTime2, input.sanitizedAt).query<InsertedIdRow>(`
        INSERT INTO dbo.psp_raw_payloads
        (
          sync_item_id,
          sync_run_id,
          psp,
          external_id,
          payload_type,
          payload_hash,
          payload_json,
          sanitized_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncItemId,
          @syncRunId,
          @psp,
          @externalId,
          @payloadType,
          @payloadHash,
          @payloadJson,
          @sanitizedAt
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async addIntegrationError(input: AddIntegrationErrorInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('syncRunSourceId', sql.BigInt, input.syncRunSourceId ?? null)
      .input('syncRunPageId', sql.BigInt, input.syncRunPageId ?? null)
      .input('syncItemId', sql.BigInt, input.syncItemId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('errorType', sql.NVarChar(50), input.errorType)
      .input('errorCode', sql.NVarChar(50), input.errorCode ?? null)
      .input('errorMessage', sql.NVarChar(2000), input.errorMessage)
      .input('retryable', sql.Bit, input.retryable)
      .input('occurredAt', sql.DateTime2, input.occurredAt).query<InsertedIdRow>(`
        INSERT INTO dbo.integration_errors
        (
          sync_run_id,
          sync_run_source_id,
          sync_run_page_id,
          sync_item_id,
          psp,
          error_type,
          error_code,
          error_message,
          retryable,
          occurred_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncRunId,
          @syncRunSourceId,
          @syncRunPageId,
          @syncItemId,
          @psp,
          @errorType,
          @errorCode,
          @errorMessage,
          @retryable,
          @occurredAt
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async addProcessingError(input: AddProcessingErrorInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('syncItemId', sql.BigInt, input.syncItemId ?? null)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('processingStage', sql.NVarChar(50), input.processingStage)
      .input('errorCode', sql.NVarChar(50), input.errorCode ?? null)
      .input('errorMessage', sql.NVarChar(2000), input.errorMessage)
      .input('retryable', sql.Bit, input.retryable)
      .input('occurredAt', sql.DateTime2, input.occurredAt).query<InsertedIdRow>(`
        INSERT INTO dbo.processing_errors
        (
          sync_run_id,
          sync_item_id,
          transaction_id,
          processing_stage,
          error_code,
          error_message,
          retryable,
          occurred_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncRunId,
          @syncItemId,
          @transactionId,
          @processingStage,
          @errorCode,
          @errorMessage,
          @retryable,
          @occurredAt
        )
      `);

    return Number(result.recordset[0].id);
  }
}
