import {
  getSqlRequest,
  sql,
} from '../../modules/shared/infrastructure/persistence/SqlServerConnection';
import type { DataConflictRepository } from '../../modules/sync/application/ports/DataConflictRepository';
import type { ReconciliationCaseRepository } from '../../modules/sync/application/ports/ReconciliationCaseRepository';
import type { RejectedRecordRepository } from '../../modules/sync/application/ports/RejectedRecordRepository';
import type { ValidationFailureRepository } from '../../modules/sync/application/ports/ValidationFailureRepository';

type InsertedIdRow = {
  id: number;
};

class SqlServerValidationFailureRepository implements ValidationFailureRepository {
  public async create(
    input: Parameters<ValidationFailureRepository['create']>[0],
  ): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncItemId', sql.BigInt, input.syncItemId)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('failureType', sql.NVarChar(50), input.failureType)
      .input('failureCode', sql.NVarChar(50), input.failureCode ?? null)
      .input('failureMessage', sql.NVarChar(2000), input.failureMessage).query<InsertedIdRow>(`
        INSERT INTO dbo.validation_failures
        (
          sync_item_id,
          transaction_id,
          psp,
          external_id,
          failure_type,
          failure_code,
          failure_message
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncItemId,
          @transactionId,
          @psp,
          @externalId,
          @failureType,
          @failureCode,
          @failureMessage
        )
      `);

    return Number(result.recordset[0].id);
  }
}

class SqlServerRejectedRecordRepository implements RejectedRecordRepository {
  public async create(input: Parameters<RejectedRecordRepository['create']>[0]): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncItemId', sql.BigInt, input.syncItemId)
      .input('validationFailureId', sql.BigInt, input.validationFailureId ?? null)
      .input('syncRunId', sql.BigInt, input.syncRunId)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('rejectionType', sql.NVarChar(80), input.rejectionType)
      .input('rejectionReason', sql.NVarChar(2000), input.rejectionReason).query<InsertedIdRow>(`
        INSERT INTO dbo.rejected_records
        (
          sync_item_id,
          validation_failure_id,
          sync_run_id,
          psp,
          external_id,
          rejection_type,
          rejection_reason
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncItemId,
          @validationFailureId,
          @syncRunId,
          @psp,
          @externalId,
          @rejectionType,
          @rejectionReason
        )
      `);

    return Number(result.recordset[0].id);
  }
}

class SqlServerDataConflictRepository implements DataConflictRepository {
  public async create(input: Parameters<DataConflictRepository['create']>[0]): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('syncItemId', sql.BigInt, input.syncItemId)
      .input('pspRawPayloadId', sql.BigInt, input.pspRawPayloadId ?? null)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('conflictType', sql.NVarChar(80), input.conflictType)
      .input('conflictStatus', sql.NVarChar(30), input.conflictStatus)
      .input('existingValue', sql.NVarChar(sql.MAX), input.existingValue ?? null)
      .input('incomingValue', sql.NVarChar(sql.MAX), input.incomingValue ?? null)
      .input('severity', sql.NVarChar(20), input.severity)
      .input('detectedAt', sql.DateTime2, input.detectedAt).query<InsertedIdRow>(`
        INSERT INTO dbo.data_conflicts
        (
          sync_item_id,
          psp_raw_payload_id,
          transaction_id,
          psp,
          external_id,
          conflict_type,
          conflict_status,
          existing_value,
          incoming_value,
          severity,
          detected_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @syncItemId,
          @pspRawPayloadId,
          @transactionId,
          @psp,
          @externalId,
          @conflictType,
          @conflictStatus,
          @existingValue,
          @incomingValue,
          @severity,
          @detectedAt
        )
      `);

    return Number(result.recordset[0].id);
  }
}

class SqlServerReconciliationCaseRepository implements ReconciliationCaseRepository {
  public async create(
    input: Parameters<ReconciliationCaseRepository['create']>[0],
  ): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('dataConflictId', sql.BigInt, input.dataConflictId ?? null)
      .input('syncItemId', sql.BigInt, input.syncItemId ?? null)
      .input('transactionId', sql.BigInt, input.transactionId ?? null)
      .input('psp', sql.NVarChar(30), input.psp)
      .input('externalId', sql.NVarChar(100), input.externalId)
      .input('caseType', sql.NVarChar(50), input.caseType)
      .input('caseStatus', sql.NVarChar(30), input.caseStatus)
      .input('severity', sql.NVarChar(20), input.severity)
      .input('openedAt', sql.DateTime2, input.openedAt).query<InsertedIdRow>(`
        INSERT INTO dbo.reconciliation_cases
        (
          data_conflict_id,
          sync_item_id,
          transaction_id,
          psp,
          external_id,
          case_type,
          case_status,
          severity,
          opened_at
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @dataConflictId,
          @syncItemId,
          @transactionId,
          @psp,
          @externalId,
          @caseType,
          @caseStatus,
          @severity,
          @openedAt
        )
      `);

    return Number(result.recordset[0].id);
  }
}

export type SyncRepositories = {
  validationFailureRepository: ValidationFailureRepository;
  rejectedRecordRepository: RejectedRecordRepository;
  dataConflictRepository: DataConflictRepository;
  reconciliationCaseRepository: ReconciliationCaseRepository;
};

export function createSyncRepositories(): SyncRepositories {
  return {
    validationFailureRepository: new SqlServerValidationFailureRepository(),
    rejectedRecordRepository: new SqlServerRejectedRecordRepository(),
    dataConflictRepository: new SqlServerDataConflictRepository(),
    reconciliationCaseRepository: new SqlServerReconciliationCaseRepository(),
  };
}
