import type { PspType } from '../../../../shared/domain/enums/pspType';
import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type {
  SyncCheckpoint,
  SyncCheckpointRepository,
} from '../../../application/ports/SyncCheckpointRepository';

type SyncCheckpointRow = {
  source_name: PspType;
  checkpoint_type: string;
  checkpoint_value: string | null;
  checkpoint_at: Date | null;
  last_successful_run_id: number | null;
  updated_at: Date;
};

export class SqlServerSyncCheckpointRepository implements SyncCheckpointRepository {
  private readonly checkpointType = 'incremental';

  public async getByPsp(psp: PspType): Promise<SyncCheckpoint | null> {
    const request = await getSqlRequest();

    const result = await request
      .input('sourceName', sql.NVarChar(50), psp)
      .input('checkpointType', sql.NVarChar(30), this.checkpointType).query<SyncCheckpointRow>(`
        SELECT TOP (1)
          source_name,
          checkpoint_type,
          checkpoint_value,
          checkpoint_at,
          last_successful_run_id,
          updated_at
        FROM dbo.sync_checkpoints
        WHERE source_name = @sourceName
          AND checkpoint_type = @checkpointType
      `);

    const row = result.recordset[0];

    if (!row) {
      return null;
    }

    const checkpointValue = row.checkpoint_value ?? 'initial';

    return {
      psp: row.source_name,
      checkpointValue,
      lastSyncAt: row.checkpoint_at ?? undefined,
      page: this.parsePage(checkpointValue),
      offset: this.parseOffset(checkpointValue),
      cursor: this.parseCursor(checkpointValue),
      updatedAt: row.updated_at,
    };
  }

  public async save(checkpoint: SyncCheckpoint): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('sourceName', sql.NVarChar(50), checkpoint.psp)
      .input('checkpointType', sql.NVarChar(30), this.checkpointType)
      .input('checkpointValue', sql.NVarChar(200), checkpoint.checkpointValue)
      .input('checkpointAt', sql.DateTime2, checkpoint.lastSyncAt ?? null).query(`
        MERGE dbo.sync_checkpoints AS target
        USING (
          SELECT
            @sourceName AS source_name,
            @checkpointType AS checkpoint_type,
            @checkpointValue AS checkpoint_value,
            @checkpointAt AS checkpoint_at
        ) AS source
        ON target.source_name = source.source_name
           AND target.checkpoint_type = source.checkpoint_type
        WHEN MATCHED THEN
          UPDATE SET
            checkpoint_value = source.checkpoint_value,
            checkpoint_at = source.checkpoint_at,
            updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT
          (
            source_name,
            checkpoint_type,
            checkpoint_value,
            checkpoint_at,
            updated_at
          )
          VALUES
          (
            source.source_name,
            source.checkpoint_type,
            source.checkpoint_value,
            source.checkpoint_at,
            SYSUTCDATETIME()
          );
      `);
  }

  private parsePage(checkpointValue: string): number | undefined {
    if (!checkpointValue.startsWith('page:')) {
      return undefined;
    }

    const parsed = Number(checkpointValue.substring('page:'.length));

    return Number.isInteger(parsed) ? parsed : undefined;
  }

  private parseOffset(checkpointValue: string): number | undefined {
    if (!checkpointValue.startsWith('offset:')) {
      return undefined;
    }

    const parsed = Number(checkpointValue.substring('offset:'.length));

    return Number.isInteger(parsed) ? parsed : undefined;
  }

  private parseCursor(checkpointValue: string): string | undefined {
    if (
      checkpointValue.startsWith('page:') ||
      checkpointValue.startsWith('offset:') ||
      checkpointValue === 'initial'
    ) {
      return undefined;
    }

    return checkpointValue;
  }
}
