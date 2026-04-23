import { getSqlRequest, sql } from '../../../shared/infrastructure/persistence/SqlServerConnection';
import type { InboxRepository } from '../../application/ports/InboxRepository';
import type { InboxMessage } from '../../domain/InboxMessage';

type InboxRow = {
  id: string;
  message_id: string;
  event_type: string;
  consumer_name: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  status: InboxMessage['status'];
  received_at: string;
  processed_at: string | null;
  correlation_id: string | null;
  last_error: string | null;
};

export class SqlServerInboxRepository implements InboxRepository {
  public async findByMessageIdAndConsumer(
    messageId: string,
    consumerName: string,
  ): Promise<InboxMessage | null> {
    const request = await getSqlRequest();

    const result = await request
      .input('messageId', sql.NVarChar(120), messageId)
      .input('consumerName', sql.NVarChar(120), consumerName).query<InboxRow>(`
        SELECT TOP (1)
          id,
          message_id,
          event_type,
          consumer_name,
          aggregate_type,
          aggregate_id,
          status,
          received_at,
          processed_at,
          correlation_id,
          last_error
        FROM dbo.inbox_messages
        WHERE message_id = @messageId
          AND consumer_name = @consumerName
      `);

    const row = result.recordset[0];

    if (!row) {
      return null;
    }

    return this.mapRow(row);
  }

  public async add(message: InboxMessage): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('id', sql.UniqueIdentifier, message.id)
      .input('messageId', sql.NVarChar(120), message.messageId)
      .input('eventType', sql.NVarChar(120), message.eventType)
      .input('consumerName', sql.NVarChar(120), message.consumerName)
      .input('aggregateType', sql.NVarChar(100), message.aggregateType ?? null)
      .input('aggregateId', sql.NVarChar(100), message.aggregateId ?? null)
      .input('status', sql.NVarChar(30), message.status)
      .input('receivedAt', sql.DateTime2, new Date(message.receivedAt))
      .input(
        'processedAt',
        sql.DateTime2,
        message.processedAt ? new Date(message.processedAt) : null,
      )
      .input('correlationId', sql.NVarChar(100), message.correlationId ?? null)
      .input('lastError', sql.NVarChar(2000), message.lastError ?? null).query(`
        INSERT INTO dbo.inbox_messages
        (
          id,
          message_id,
          event_type,
          consumer_name,
          aggregate_type,
          aggregate_id,
          status,
          received_at,
          processed_at,
          correlation_id,
          last_error
        )
        VALUES
        (
          @id,
          @messageId,
          @eventType,
          @consumerName,
          @aggregateType,
          @aggregateId,
          @status,
          @receivedAt,
          @processedAt,
          @correlationId,
          @lastError
        )
      `);
  }

  public async markProcessing(id: string): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('id', sql.UniqueIdentifier, id)
      .query(`UPDATE dbo.inbox_messages SET status = 'processing' WHERE id = @id`);
  }

  public async markProcessed(id: string, processedAt: string): Promise<void> {
    const request = await getSqlRequest();

    await request
      .input('id', sql.UniqueIdentifier, id)
      .input('processedAt', sql.DateTime2, new Date(processedAt)).query(`
        UPDATE dbo.inbox_messages
        SET
          status = 'processed',
          processed_at = @processedAt
        WHERE id = @id
      `);
  }

  public async markFailed(id: string, reason: string): Promise<void> {
    const request = await getSqlRequest();

    await request.input('id', sql.UniqueIdentifier, id).input('reason', sql.NVarChar(2000), reason)
      .query(`
        UPDATE dbo.inbox_messages
        SET
          status = 'failed',
          last_error = @reason
        WHERE id = @id
      `);
  }

  public async markIgnoredDuplicate(id: string): Promise<void> {
    const request = await getSqlRequest();

    await request.input('id', sql.UniqueIdentifier, id).query(`
        UPDATE dbo.inbox_messages
        SET status = 'ignored_duplicate'
        WHERE id = @id
      `);
  }

  private mapRow(row: InboxRow): InboxMessage {
    return {
      id: row.id,
      messageId: row.message_id,
      eventType: row.event_type,
      consumerName: row.consumer_name,
      aggregateType: row.aggregate_type ?? undefined,
      aggregateId: row.aggregate_id ?? undefined,
      status: row.status,
      receivedAt: row.received_at,
      processedAt: row.processed_at ?? undefined,
      correlationId: row.correlation_id ?? undefined,
      lastError: row.last_error ?? undefined,
    };
  }
}
