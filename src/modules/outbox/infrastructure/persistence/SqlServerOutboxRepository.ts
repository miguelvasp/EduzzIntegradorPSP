import { getSqlRequest, sql } from '../../../shared/infrastructure/persistence/SqlServerConnection';
import type { OutboxRepository } from '../../application/ports/OutboxRepository';
import type { OutboxMessage } from '../../domain/OutboxMessage';

type OutboxRow = {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload_json: string;
  status: OutboxMessage['status'];
  created_at: string;
  available_at: string;
  correlation_id: string | null;
  sync_run_id: string | null;
  retry_count: number;
  last_error: string | null;
};

export class SqlServerOutboxRepository implements OutboxRepository {
  public async add(message: OutboxMessage): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('id', sql.UniqueIdentifier, message.id)
      .input('eventType', sql.NVarChar(120), message.eventType)
      .input('aggregateType', sql.NVarChar(100), message.aggregateType)
      .input('aggregateId', sql.NVarChar(100), message.aggregateId)
      .input('payloadJson', sql.NVarChar(sql.MAX), JSON.stringify(message.payload))
      .input('status', sql.NVarChar(30), message.status)
      .input('createdAt', sql.DateTime2, new Date(message.createdAt))
      .input('availableAt', sql.DateTime2, new Date(message.availableAt))
      .input('correlationId', sql.NVarChar(100), message.correlationId ?? null)
      .input('syncRunId', sql.NVarChar(100), message.syncRunId ?? null)
      .input('retryCount', sql.Int, message.retryCount)
      .input('lastError', sql.NVarChar(2000), message.lastError ?? null).query(`
        INSERT INTO dbo.outbox_messages
        (
          id,
          event_type,
          aggregate_type,
          aggregate_id,
          payload_json,
          status,
          created_at,
          available_at,
          correlation_id,
          sync_run_id,
          retry_count,
          last_error
        )
        VALUES
        (
          @id,
          @eventType,
          @aggregateType,
          @aggregateId,
          @payloadJson,
          @status,
          @createdAt,
          @availableAt,
          @correlationId,
          @syncRunId,
          @retryCount,
          @lastError
        )
      `);
  }

  public async findDispatchable(batchSize: number, now: string): Promise<OutboxMessage[]> {
    const request = await getSqlRequest();

    const result = await request
      .input('batchSize', sql.Int, batchSize)
      .input('now', sql.DateTime2, new Date(now)).query<OutboxRow>(`
        SELECT TOP (@batchSize)
          id,
          event_type,
          aggregate_type,
          aggregate_id,
          payload_json,
          status,
          created_at,
          available_at,
          correlation_id,
          sync_run_id,
          retry_count,
          last_error
        FROM dbo.outbox_messages
        WHERE status IN ('pending', 'retry_scheduled')
          AND available_at <= @now
        ORDER BY created_at ASC
      `);

    return result.recordset.map(this.mapRow);
  }

  public async markProcessing(messageId: string): Promise<boolean> {
    const request = await getSqlRequest();

    const result = await request.input('messageId', sql.UniqueIdentifier, messageId).query(`
        UPDATE dbo.outbox_messages
        SET status = 'processing'
        WHERE id = @messageId
          AND status IN ('pending', 'retry_scheduled');

        SELECT @@ROWCOUNT AS affected_rows;
      `);

    return result.recordset[0].affected_rows > 0;
  }

  public async markProcessed(messageId: string, processedAt: string): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('messageId', sql.UniqueIdentifier, messageId)
      .input('processedAt', sql.DateTime2, new Date(processedAt)).query(`
        UPDATE dbo.outbox_messages
        SET
          status = 'processed',
          processed_at = @processedAt
        WHERE id = @messageId
      `);
  }

  public async scheduleRetry(
    messageId: string,
    nextAttemptAt: string,
    retryCount: number,
    lastError: string,
  ): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('messageId', sql.UniqueIdentifier, messageId)
      .input('nextAttemptAt', sql.DateTime2, new Date(nextAttemptAt))
      .input('retryCount', sql.Int, retryCount)
      .input('lastError', sql.NVarChar(2000), lastError).query(`
        UPDATE dbo.outbox_messages
        SET
          status = 'retry_scheduled',
          available_at = @nextAttemptAt,
          retry_count = @retryCount,
          last_error = @lastError
        WHERE id = @messageId
      `);
  }

  public async markDeadLettered(
    messageId: string,
    reason: string,
    retryCount: number,
  ): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('messageId', sql.UniqueIdentifier, messageId)
      .input('reason', sql.NVarChar(2000), reason)
      .input('retryCount', sql.Int, retryCount).query(`
        UPDATE dbo.outbox_messages
        SET
          status = 'dead_lettered',
          last_error = @reason,
          retry_count = @retryCount
        WHERE id = @messageId
      `);
  }

  public async markFailedTerminal(
    messageId: string,
    reason: string,
    retryCount: number,
  ): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('messageId', sql.UniqueIdentifier, messageId)
      .input('reason', sql.NVarChar(2000), reason)
      .input('retryCount', sql.Int, retryCount).query(`
        UPDATE dbo.outbox_messages
        SET
          status = 'failed_terminal',
          last_error = @reason,
          retry_count = @retryCount
        WHERE id = @messageId
      `);
  }

  private mapRow(row: OutboxRow): OutboxMessage {
    return {
      id: row.id,
      eventType: row.event_type,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: JSON.parse(row.payload_json) as Record<string, unknown>,
      status: row.status,
      createdAt: row.created_at,
      availableAt: row.available_at,
      correlationId: row.correlation_id ?? undefined,
      syncRunId: row.sync_run_id ?? undefined,
      retryCount: row.retry_count,
      lastError: row.last_error ?? undefined,
    };
  }
}
