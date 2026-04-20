USE EduzzMultiPsp;
GO

CREATE NONCLUSTERED INDEX IX_sync_run_sources_sync_run_id
    ON dbo.sync_run_sources(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_run_sources_source_name_status
    ON dbo.sync_run_sources(source_name, status, started_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_sync_run_pages_sync_run_id
    ON dbo.sync_run_pages(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_run_pages_sync_run_source_id
    ON dbo.sync_run_pages(sync_run_source_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_run_pages_status_started_at
    ON dbo.sync_run_pages(status, started_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_id
    ON dbo.sync_items(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_source_id
    ON dbo.sync_items(sync_run_source_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_sync_run_page_id
    ON dbo.sync_items(sync_run_page_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_psp_external_id
    ON dbo.sync_items(psp, external_id);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_processing_result
    ON dbo.sync_items(processing_result, processed_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_sync_items_transaction_id
    ON dbo.sync_items(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_sync_item_id
    ON dbo.psp_raw_payloads(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_sync_run_id
    ON dbo.psp_raw_payloads(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_psp_raw_payloads_psp_external_id
    ON dbo.psp_raw_payloads(psp, external_id, sanitized_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_installment_status_history_installment_id_changed_at
    ON dbo.installment_status_history(installment_id, changed_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_installment_status_history_sync_run_id
    ON dbo.installment_status_history(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_integration_errors_sync_run_id
    ON dbo.integration_errors(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_integration_errors_sync_item_id
    ON dbo.integration_errors(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_integration_errors_psp_error_type_occurred_at
    ON dbo.integration_errors(psp, error_type, occurred_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_processing_errors_sync_run_id
    ON dbo.processing_errors(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_processing_errors_sync_item_id
    ON dbo.processing_errors(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_processing_errors_transaction_id
    ON dbo.processing_errors(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_processing_errors_processing_stage_occurred_at
    ON dbo.processing_errors(processing_stage, occurred_at DESC);
GO