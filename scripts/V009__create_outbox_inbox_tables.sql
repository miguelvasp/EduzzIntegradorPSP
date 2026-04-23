USE EduzzMultiPsp;
GO

IF OBJECT_ID('dbo.outbox_messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.outbox_messages
    (
        id UNIQUEIDENTIFIER NOT NULL,
        event_type NVARCHAR(120) NOT NULL,
        aggregate_type NVARCHAR(100) NOT NULL,
        aggregate_id NVARCHAR(100) NOT NULL,
        payload_json NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(30) NOT NULL,
        created_at DATETIME2(3) NOT NULL,
        available_at DATETIME2(3) NOT NULL,
        processed_at DATETIME2(3) NULL,
        correlation_id NVARCHAR(100) NULL,
        sync_run_id NVARCHAR(100) NULL,
        retry_count INT NOT NULL CONSTRAINT DF_outbox_messages_retry_count DEFAULT (0),
        last_error NVARCHAR(2000) NULL,
        CONSTRAINT PK_outbox_messages PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_outbox_messages_status CHECK (status IN ('pending', 'processing', 'processed', 'retry_scheduled', 'dead_lettered', 'failed_terminal')),
        CONSTRAINT CK_outbox_messages_payload_json_is_json CHECK (ISJSON(payload_json) = 1)
    );
END;
GO

IF OBJECT_ID('dbo.inbox_messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.inbox_messages
    (
        id UNIQUEIDENTIFIER NOT NULL,
        message_id NVARCHAR(120) NOT NULL,
        event_type NVARCHAR(120) NOT NULL,
        consumer_name NVARCHAR(120) NOT NULL,
        aggregate_type NVARCHAR(100) NULL,
        aggregate_id NVARCHAR(100) NULL,
        status NVARCHAR(30) NOT NULL,
        received_at DATETIME2(3) NOT NULL,
        processed_at DATETIME2(3) NULL,
        correlation_id NVARCHAR(100) NULL,
        last_error NVARCHAR(2000) NULL,
        CONSTRAINT PK_inbox_messages PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_inbox_messages_message_id_consumer_name UNIQUE (message_id, consumer_name),
        CONSTRAINT CK_inbox_messages_status CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored_duplicate'))
    );
END;
GO