USE EduzzMultiPsp;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_run_sources_sync_run_id'
      AND object_id = OBJECT_ID('dbo.sync_run_sources')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_run_sources_sync_run_id
        ON dbo.sync_run_sources(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_run_sources_source_name_status'
      AND object_id = OBJECT_ID('dbo.sync_run_sources')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_run_sources_source_name_status
        ON dbo.sync_run_sources(source_name, status, started_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_run_pages_sync_run_id'
      AND object_id = OBJECT_ID('dbo.sync_run_pages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_run_pages_sync_run_id
        ON dbo.sync_run_pages(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_run_pages_sync_run_source_id'
      AND object_id = OBJECT_ID('dbo.sync_run_pages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_run_pages_sync_run_source_id
        ON dbo.sync_run_pages(sync_run_source_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_run_pages_status_started_at'
      AND object_id = OBJECT_ID('dbo.sync_run_pages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_run_pages_status_started_at
        ON dbo.sync_run_pages(status, started_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_sync_run_id'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_id
        ON dbo.sync_items(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_sync_run_source_id'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_source_id
        ON dbo.sync_items(sync_run_source_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_sync_run_page_id'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_page_id
        ON dbo.sync_items(sync_run_page_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_psp_external_id'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_psp_external_id
        ON dbo.sync_items(psp, external_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_processing_result'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_processing_result
        ON dbo.sync_items(processing_result, processed_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_sync_items_transaction_id'
      AND object_id = OBJECT_ID('dbo.sync_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_items_transaction_id
        ON dbo.sync_items(transaction_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_psp_raw_payloads_sync_item_id'
      AND object_id = OBJECT_ID('dbo.psp_raw_payloads')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_sync_item_id
        ON dbo.psp_raw_payloads(sync_item_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_psp_raw_payloads_sync_run_id'
      AND object_id = OBJECT_ID('dbo.psp_raw_payloads')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_sync_run_id
        ON dbo.psp_raw_payloads(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_psp_raw_payloads_psp_external_id'
      AND object_id = OBJECT_ID('dbo.psp_raw_payloads')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_psp_external_id
        ON dbo.psp_raw_payloads(psp, external_id, sanitized_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_installment_status_history_installment_id_changed_at'
      AND object_id = OBJECT_ID('dbo.installment_status_history')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_installment_status_history_installment_id_changed_at
        ON dbo.installment_status_history(installment_id, changed_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_installment_status_history_sync_run_id'
      AND object_id = OBJECT_ID('dbo.installment_status_history')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_installment_status_history_sync_run_id
        ON dbo.installment_status_history(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_integration_errors_sync_run_id'
      AND object_id = OBJECT_ID('dbo.integration_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_integration_errors_sync_run_id
        ON dbo.integration_errors(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_integration_errors_sync_item_id'
      AND object_id = OBJECT_ID('dbo.integration_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_integration_errors_sync_item_id
        ON dbo.integration_errors(sync_item_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_integration_errors_psp_error_type_occurred_at'
      AND object_id = OBJECT_ID('dbo.integration_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_integration_errors_psp_error_type_occurred_at
        ON dbo.integration_errors(psp, error_type, occurred_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_processing_errors_sync_run_id'
      AND object_id = OBJECT_ID('dbo.processing_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_processing_errors_sync_run_id
        ON dbo.processing_errors(sync_run_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_processing_errors_sync_item_id'
      AND object_id = OBJECT_ID('dbo.processing_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_processing_errors_sync_item_id
        ON dbo.processing_errors(sync_item_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_processing_errors_transaction_id'
      AND object_id = OBJECT_ID('dbo.processing_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_processing_errors_transaction_id
        ON dbo.processing_errors(transaction_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_processing_errors_processing_stage_occurred_at'
      AND object_id = OBJECT_ID('dbo.processing_errors')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_processing_errors_processing_stage_occurred_at
        ON dbo.processing_errors(processing_stage, occurred_at DESC);
END;
GO