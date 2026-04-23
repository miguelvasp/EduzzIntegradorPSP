USE EduzzMultiPsp;
GO

IF OBJECT_ID('dbo.sync_run_sources', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_run_sources
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_run_id BIGINT NOT NULL,
        source_name NVARCHAR(50) NOT NULL,
        status NVARCHAR(30) NOT NULL,
        started_at DATETIME2(3) NOT NULL,
        finished_at DATETIME2(3) NULL,
        items_read INT NOT NULL CONSTRAINT DF_sync_run_sources_items_read DEFAULT (0),
        items_processed INT NOT NULL CONSTRAINT DF_sync_run_sources_items_processed DEFAULT (0),
        items_succeeded INT NOT NULL CONSTRAINT DF_sync_run_sources_items_succeeded DEFAULT (0),
        items_failed INT NOT NULL CONSTRAINT DF_sync_run_sources_items_failed DEFAULT (0),
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_run_sources_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_sync_run_sources PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_sync_run_sources_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
        CONSTRAINT FK_sync_run_sources_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.sync_run_pages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_run_pages
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_run_id BIGINT NOT NULL,
        sync_run_source_id BIGINT NULL,
        page_number INT NULL,
        page_size INT NULL,
        cursor_value NVARCHAR(200) NULL,
        offset_value INT NULL,
        reference_value NVARCHAR(200) NULL,
        started_at DATETIME2(3) NOT NULL,
        finished_at DATETIME2(3) NULL,
        status NVARCHAR(30) NOT NULL,
        items_read INT NOT NULL CONSTRAINT DF_sync_run_pages_items_read DEFAULT (0),
        items_processed INT NOT NULL CONSTRAINT DF_sync_run_pages_items_processed DEFAULT (0),
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_run_pages_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_sync_run_pages PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_sync_run_pages_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
        CONSTRAINT CK_sync_run_pages_page_number CHECK (page_number IS NULL OR page_number > 0),
        CONSTRAINT CK_sync_run_pages_page_size CHECK (page_size IS NULL OR page_size > 0),
        CONSTRAINT CK_sync_run_pages_offset_value CHECK (offset_value IS NULL OR offset_value >= 0),
        CONSTRAINT FK_sync_run_pages_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id),
        CONSTRAINT FK_sync_run_pages_sync_run_source_id FOREIGN KEY (sync_run_source_id) REFERENCES dbo.sync_run_sources(id)
    );
END;
GO

IF OBJECT_ID('dbo.sync_items', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_items
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_run_id BIGINT NOT NULL,
        sync_run_source_id BIGINT NULL,
        sync_run_page_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        resource_type NVARCHAR(50) NOT NULL,
        processing_result NVARCHAR(30) NOT NULL,
        transaction_id BIGINT NULL,
        received_at DATETIME2(3) NOT NULL,
        processed_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_sync_items_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_sync_items PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_sync_items_processing_result CHECK (processing_result IN ('received', 'processed', 'inserted', 'updated', 'ignored', 'rejected', 'conflicted', 'failed')),
        CONSTRAINT FK_sync_items_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id),
        CONSTRAINT FK_sync_items_sync_run_source_id FOREIGN KEY (sync_run_source_id) REFERENCES dbo.sync_run_sources(id),
        CONSTRAINT FK_sync_items_sync_run_page_id FOREIGN KEY (sync_run_page_id) REFERENCES dbo.sync_run_pages(id),
        CONSTRAINT FK_sync_items_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
    );
END;
GO

IF OBJECT_ID('dbo.psp_raw_payloads', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.psp_raw_payloads
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_item_id BIGINT NOT NULL,
        sync_run_id BIGINT NOT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        payload_type NVARCHAR(50) NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        payload_json NVARCHAR(MAX) NOT NULL,
        sanitized_at DATETIME2(3) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_psp_raw_payloads_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_psp_raw_payloads PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_psp_raw_payloads_payload_json_is_json CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT FK_psp_raw_payloads_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_psp_raw_payloads_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.installment_status_history', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.installment_status_history
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        installment_id BIGINT NOT NULL,
        previous_status NVARCHAR(40) NULL,
        new_status NVARCHAR(40) NOT NULL,
        status_source NVARCHAR(30) NOT NULL,
        changed_at DATETIME2(3) NOT NULL,
        sync_run_id BIGINT NULL,
        reason_code NVARCHAR(50) NULL,
        notes NVARCHAR(500) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_installment_status_history_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_installment_status_history PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_installment_status_history_installment_id FOREIGN KEY (installment_id) REFERENCES dbo.installments(id),
        CONSTRAINT FK_installment_status_history_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.integration_errors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.integration_errors
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_run_id BIGINT NOT NULL,
        sync_run_source_id BIGINT NULL,
        sync_run_page_id BIGINT NULL,
        sync_item_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        error_type NVARCHAR(50) NOT NULL,
        error_code NVARCHAR(50) NULL,
        error_message NVARCHAR(2000) NOT NULL,
        retryable BIT NOT NULL CONSTRAINT DF_integration_errors_retryable DEFAULT (0),
        occurred_at DATETIME2(3) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_integration_errors_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_integration_errors PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_integration_errors_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id),
        CONSTRAINT FK_integration_errors_sync_run_source_id FOREIGN KEY (sync_run_source_id) REFERENCES dbo.sync_run_sources(id),
        CONSTRAINT FK_integration_errors_sync_run_page_id FOREIGN KEY (sync_run_page_id) REFERENCES dbo.sync_run_pages(id),
        CONSTRAINT FK_integration_errors_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id)
    );
END;
GO

IF OBJECT_ID('dbo.processing_errors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.processing_errors
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_run_id BIGINT NOT NULL,
        sync_item_id BIGINT NULL,
        transaction_id BIGINT NULL,
        processing_stage NVARCHAR(50) NOT NULL,
        error_code NVARCHAR(50) NULL,
        error_message NVARCHAR(2000) NOT NULL,
        retryable BIT NOT NULL CONSTRAINT DF_processing_errors_retryable DEFAULT (0),
        occurred_at DATETIME2(3) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_processing_errors_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_processing_errors PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_processing_errors_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id),
        CONSTRAINT FK_processing_errors_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_processing_errors_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
    );
END;
GO