import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type {
  RecordInstallmentStatusHistoryInput,
  RecordTransactionEventInput,
  RecordTransactionIntegrationEvidenceInput,
  RecordTransactionStatusHistoryInput,
  TransactionAuditRepository,
} from '../../../application/ports/TransactionAuditRepository';

type InsertedIdRow = {
  id: number;
};

export class SqlServerTransactionAuditRepository implements TransactionAuditRepository {
  public async recordTransactionEvent(input: RecordTransactionEventInput): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('transactionId', sql.BigInt, input.transactionId)
      .input('eventType', sql.NVarChar(50), input.eventType)
      .input('eventStatus', sql.NVarChar(30), input.eventStatus)
      .input('occurredAt', sql.DateTime2, input.occurredAt)
      .input('syncRunId', sql.BigInt, input.syncRunId ?? null)
      .input('payloadHash', sql.Char(64), input.payloadHash ?? null)
      .input('payloadJson', sql.NVarChar(sql.MAX), input.payloadJson ?? null).query<InsertedIdRow>(`
        INSERT INTO dbo.transaction_events
        (
          transaction_id,
          event_type,
          event_status,
          occurred_at,
          sync_run_id,
          payload_hash,
          payload_json
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @transactionId,
          @eventType,
          @eventStatus,
          @occurredAt,
          @syncRunId,
          @payloadHash,
          @payloadJson
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async recordTransactionStatusHistory(
    input: RecordTransactionStatusHistoryInput,
  ): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('transactionId', sql.BigInt, input.transactionId)
      .input('previousStatus', sql.NVarChar(40), input.previousStatus ?? null)
      .input('newStatus', sql.NVarChar(40), input.newStatus)
      .input('statusSource', sql.NVarChar(30), input.statusSource)
      .input('changedAt', sql.DateTime2, input.changedAt)
      .input('syncRunId', sql.BigInt, input.syncRunId ?? null)
      .input('reasonCode', sql.NVarChar(50), input.reasonCode ?? null)
      .input('notes', sql.NVarChar(500), input.notes ?? null).query<InsertedIdRow>(`
        INSERT INTO dbo.transaction_status_history
        (
          transaction_id,
          previous_status,
          new_status,
          status_source,
          changed_at,
          sync_run_id,
          reason_code,
          notes
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @transactionId,
          @previousStatus,
          @newStatus,
          @statusSource,
          @changedAt,
          @syncRunId,
          @reasonCode,
          @notes
        )
      `);

    return Number(result.recordset[0].id);
  }

  public async recordInstallmentStatusHistory(
    inputs: RecordInstallmentStatusHistoryInput[],
  ): Promise<void> {
    for (const input of inputs) {
      const request = await getSqlRequest();

      await request
        .input('installmentId', sql.BigInt, input.installmentId)
        .input('previousStatus', sql.NVarChar(40), input.previousStatus ?? null)
        .input('newStatus', sql.NVarChar(40), input.newStatus)
        .input('statusSource', sql.NVarChar(30), input.statusSource)
        .input('changedAt', sql.DateTime2, input.changedAt)
        .input('syncRunId', sql.BigInt, input.syncRunId ?? null)
        .input('reasonCode', sql.NVarChar(50), input.reasonCode ?? null)
        .input('notes', sql.NVarChar(500), input.notes ?? null).query(`
          INSERT INTO dbo.installment_status_history
          (
            installment_id,
            previous_status,
            new_status,
            status_source,
            changed_at,
            sync_run_id,
            reason_code,
            notes
          )
          VALUES
          (
            @installmentId,
            @previousStatus,
            @newStatus,
            @statusSource,
            @changedAt,
            @syncRunId,
            @reasonCode,
            @notes
          )
        `);
    }
  }

  public async recordTransactionIntegrationEvidence(
    input: RecordTransactionIntegrationEvidenceInput,
  ): Promise<number> {
    const clearLatestRequest = await getSqlRequest();

    await clearLatestRequest
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('resourceType', sql.NVarChar(50), input.resourceType)
      .input('resourceId', sql.NVarChar(100), input.resourceId ?? null).query(`
        UPDATE dbo.transaction_integration_evidences
        SET
          is_latest = 0
        WHERE psp = @psp
          AND external_id = @externalId
          AND resource_type = @resourceType
          AND (
            (@resourceId IS NULL AND resource_id IS NULL)
            OR resource_id = @resourceId
          )
          AND is_latest = 1
      `);

    const insertRequest = await getSqlRequest();

    const result = await insertRequest
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('resourceType', sql.NVarChar(50), input.resourceType)
      .input('resourceId', sql.NVarChar(100), input.resourceId ?? null)
      .input('captureType', sql.NVarChar(30), input.captureType)
      .input('capturedAt', sql.DateTime2, input.capturedAt)
      .input('syncRunId', sql.BigInt, input.syncRunId ?? null)
      .input('httpStatusCode', sql.Int, input.httpStatusCode ?? null)
      .input('payloadHash', sql.Char(64), input.payloadHash)
      .input('payloadJson', sql.NVarChar(sql.MAX), input.payloadJson).query<InsertedIdRow>(`
        INSERT INTO dbo.transaction_integration_evidences
        (
          transaction_id,
          psp,
          external_id,
          resource_type,
          resource_id,
          capture_type,
          captured_at,
          sync_run_id,
          http_status_code,
          payload_hash,
          payload_json,
          is_latest
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @transactionId,
          @psp,
          @externalId,
          @resourceType,
          @resourceId,
          @captureType,
          @capturedAt,
          @syncRunId,
          @httpStatusCode,
          @payloadHash,
          @payloadJson,
          1
        )
      `);

    return Number(result.recordset[0].id);
  }
}
