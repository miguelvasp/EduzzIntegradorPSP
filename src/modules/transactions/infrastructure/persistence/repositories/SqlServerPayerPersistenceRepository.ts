import type { PspType } from '../../../../shared/domain/enums/pspType';
import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { PayerPersistenceRepository } from '../../../application/ports/PayerPersistenceRepository';
import type { PayerSnapshot } from '../../../domain/entities';

export class SqlServerPayerPersistenceRepository implements PayerPersistenceRepository {
  public async upsertFromSnapshot(params: { psp: PspType; payer: PayerSnapshot }): Promise<number> {
    const request = await getSqlRequest();

    const result = await request
      .input('psp', sql.NVarChar(30), params.psp)
      .input('externalId', sql.NVarChar(100), params.payer.externalId ?? null)
      .input('name', sql.NVarChar(200), params.payer.name)
      .input('email', sql.NVarChar(320), params.payer.email)
      .input('documentHash', sql.Char(64), params.payer.documentHash.value)
      .input('documentType', sql.NVarChar(20), params.payer.documentType).query<{ id: number }>(`
        DECLARE @output TABLE (id BIGINT);

        MERGE dbo.payers AS target
        USING (
          SELECT
            @psp AS psp,
            @externalId AS external_id,
            @documentHash AS document_hash
        ) AS source
        ON target.psp = source.psp
           AND (
             (source.external_id IS NOT NULL AND target.external_id = source.external_id)
             OR target.document_hash = source.document_hash
           )
        WHEN MATCHED THEN
          UPDATE SET
            name = @name,
            email = @email,
            document_type = @documentType,
            has_document = 1,
            updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT
          (
            psp,
            external_id,
            name,
            email,
            document_hash,
            document_type,
            has_document
          )
          VALUES
          (
            @psp,
            @externalId,
            @name,
            @email,
            @documentHash,
            @documentType,
            1
          )
        OUTPUT inserted.id INTO @output(id);

        SELECT TOP (1) id FROM @output;
      `);

    return result.recordset[0].id;
  }

  public async saveSnapshot(params: {
    transactionId: number;
    payerId: number;
    psp: PspType;
    payer: PayerSnapshot;
  }): Promise<void> {
    const versionRequest = await getSqlRequest();

    const versionResult = await versionRequest.input(
      'transactionId',
      sql.BigInt,
      params.transactionId,
    ).query<{ next_version: number }>(`
        SELECT ISNULL(MAX(snapshot_version), 0) + 1 AS next_version
        FROM dbo.transaction_payer_snapshots
        WHERE transaction_id = @transactionId
      `);

    const snapshotVersion = versionResult.recordset[0].next_version;
    const insertRequest = await getSqlRequest();

    await insertRequest
      .input('transactionId', sql.BigInt, params.transactionId)
      .input('payerId', sql.BigInt, params.payerId)
      .input('psp', sql.NVarChar(30), params.psp)
      .input('externalId', sql.NVarChar(100), params.payer.externalId ?? null)
      .input('name', sql.NVarChar(200), params.payer.name)
      .input('email', sql.NVarChar(320), params.payer.email)
      .input('documentHash', sql.Char(64), params.payer.documentHash.value)
      .input('documentType', sql.NVarChar(20), params.payer.documentType)
      .input('snapshotVersion', sql.Int, snapshotVersion).query(`
        INSERT INTO dbo.transaction_payer_snapshots
        (
          transaction_id,
          payer_id,
          psp,
          external_id,
          name,
          email,
          document_hash,
          document_type,
          snapshot_version
        )
        VALUES
        (
          @transactionId,
          @payerId,
          @psp,
          @externalId,
          @name,
          @email,
          @documentHash,
          @documentType,
          @snapshotVersion
        )
      `);
  }
}
