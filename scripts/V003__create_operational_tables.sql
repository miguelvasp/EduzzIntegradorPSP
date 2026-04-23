USE EduzzMultiPsp;
GO

IF OBJECT_ID('dbo.sync_runs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_runs
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        source_name NVARCHAR(50) NOT NULL,
        trigger_type NVARCHAR(30) NOT NULL,
        status NVARCHAR(30) NOT NULL,
        requested_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_runs_requested_at DEFAULT (SYSUTCDATETIME()),
        requested_by NVARCHAR(100) NULL,
        started_at DATETIME2(3) NOT NULL,
        finished_at DATETIME2(3) NULL,
        items_read INT NOT NULL CONSTRAINT DF_sync_runs_items_read DEFAULT (0),
        items_processed INT NOT NULL CONSTRAINT DF_sync_runs_items_processed DEFAULT (0),
        items_succeeded INT NOT NULL CONSTRAINT DF_sync_runs_items_succeeded DEFAULT (0),
        items_failed INT NOT NULL CONSTRAINT DF_sync_runs_items_failed DEFAULT (0),
        error_count INT NOT NULL CONSTRAINT DF_sync_runs_error_count DEFAULT (0),
        error_summary NVARCHAR(1000) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_runs_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_sync_runs PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_sync_runs_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial'))
    );
END;
GO

IF OBJECT_ID('dbo.sync_checkpoints', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_checkpoints
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        source_name NVARCHAR(50) NOT NULL,
        checkpoint_type NVARCHAR(30) NOT NULL,
        checkpoint_value NVARCHAR(200) NULL,
        checkpoint_at DATETIME2(3) NULL,
        last_successful_run_id BIGINT NULL,
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_checkpoints_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_sync_checkpoints PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sync_checkpoints_source_name_checkpoint_type UNIQUE (source_name, checkpoint_type),
        CONSTRAINT FK_sync_checkpoints_last_successful_run_id FOREIGN KEY (last_successful_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.idempotency_registry', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.idempotency_registry
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        scope NVARCHAR(50) NOT NULL,
        idempotency_key NVARCHAR(200) NOT NULL,
        resource_type NVARCHAR(50) NOT NULL,
        resource_id BIGINT NULL,
        request_fingerprint CHAR(64) NULL,
        status NVARCHAR(30) NOT NULL,
        first_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_idempotency_registry_first_seen_at DEFAULT (SYSUTCDATETIME()),
        last_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_idempotency_registry_last_seen_at DEFAULT (SYSUTCDATETIME()),
        expires_at DATETIME2(3) NULL,
        CONSTRAINT PK_idempotency_registry PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_idempotency_registry_scope_idempotency_key UNIQUE (scope, idempotency_key)
    );
END;
GO

IF OBJECT_ID('dbo.transaction_status_history', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.transaction_status_history
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        transaction_id BIGINT NOT NULL,
        previous_status NVARCHAR(40) NULL,
        new_status NVARCHAR(40) NOT NULL,
        status_source NVARCHAR(30) NOT NULL,
        changed_at DATETIME2(3) NOT NULL,
        sync_run_id BIGINT NULL,
        reason_code NVARCHAR(50) NULL,
        notes NVARCHAR(500) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transaction_status_history_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_transaction_status_history PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_transaction_status_history_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id),
        CONSTRAINT FK_transaction_status_history_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.transaction_events', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.transaction_events
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        transaction_id BIGINT NOT NULL,
        event_type NVARCHAR(50) NOT NULL,
        event_status NVARCHAR(30) NOT NULL,
        occurred_at DATETIME2(3) NOT NULL,
        sync_run_id BIGINT NULL,
        payload_hash CHAR(64) NULL,
        payload_json NVARCHAR(MAX) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transaction_events_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_transaction_events PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_transaction_events_payload_json_is_json CHECK (payload_json IS NULL OR ISJSON(payload_json) = 1),
        CONSTRAINT FK_transaction_events_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id),
        CONSTRAINT FK_transaction_events_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.transaction_integration_evidences', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.transaction_integration_evidences
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        transaction_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        resource_type NVARCHAR(50) NOT NULL,
        resource_id NVARCHAR(100) NULL,
        capture_type NVARCHAR(30) NOT NULL,
        captured_at DATETIME2(3) NOT NULL,
        sync_run_id BIGINT NULL,
        http_status_code INT NULL,
        payload_hash CHAR(64) NOT NULL,
        payload_json NVARCHAR(MAX) NOT NULL,
        is_latest BIT NOT NULL CONSTRAINT DF_transaction_integration_evidences_is_latest DEFAULT (1),
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transaction_integration_evidences_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_transaction_integration_evidences PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_transaction_integration_evidences_http_status_code CHECK (http_status_code IS NULL OR (http_status_code BETWEEN 100 AND 599)),
        CONSTRAINT CK_transaction_integration_evidences_payload_json_is_json CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT FK_transaction_integration_evidences_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id),
        CONSTRAINT FK_transaction_integration_evidences_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO