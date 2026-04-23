USE EduzzMultiPsp;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_outbox_messages_status_available_at'
      AND object_id = OBJECT_ID('dbo.outbox_messages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbox_messages_status_available_at
        ON dbo.outbox_messages(status, available_at ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_outbox_messages_aggregate_type_aggregate_id'
      AND object_id = OBJECT_ID('dbo.outbox_messages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbox_messages_aggregate_type_aggregate_id
        ON dbo.outbox_messages(aggregate_type, aggregate_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_inbox_messages_status_received_at'
      AND object_id = OBJECT_ID('dbo.inbox_messages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_inbox_messages_status_received_at
        ON dbo.inbox_messages(status, received_at ASC);
END;
GO