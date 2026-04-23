USE EduzzMultiPsp;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_payers_psp_external_id'
      AND object_id = OBJECT_ID('dbo.payers')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_payers_psp_external_id
        ON dbo.payers(psp, external_id)
        WHERE external_id IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_payers_document_hash'
      AND object_id = OBJECT_ID('dbo.payers')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_payers_document_hash
        ON dbo.payers(document_hash);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_payers_email'
      AND object_id = OBJECT_ID('dbo.payers')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_payers_email
        ON dbo.payers(email);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transactions_psp_status_psp_created_at'
      AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transactions_psp_status_psp_created_at
        ON dbo.transactions(psp, status, psp_created_at DESC)
        INCLUDE (currency, original_amount, net_amount, fees, installment_count, payer_id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transactions_psp_created_at'
      AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transactions_psp_created_at
        ON dbo.transactions(psp, psp_created_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transactions_status_psp_created_at'
      AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transactions_status_psp_created_at
        ON dbo.transactions(status, psp_created_at DESC)
        INCLUDE (psp, currency, original_amount, net_amount, fees, installment_count);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transactions_payer_id'
      AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transactions_payer_id
        ON dbo.transactions(payer_id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transactions_last_synced_at'
      AND object_id = OBJECT_ID('dbo.transactions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transactions_last_synced_at
        ON dbo.transactions(last_synced_at);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_transaction_payer_snapshots_transaction_id_snapshot_version'
      AND object_id = OBJECT_ID('dbo.transaction_payer_snapshots')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_transaction_payer_snapshots_transaction_id_snapshot_version
        ON dbo.transaction_payer_snapshots(transaction_id, snapshot_version);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_payer_snapshots_transaction_id'
      AND object_id = OBJECT_ID('dbo.transaction_payer_snapshots')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_payer_snapshots_transaction_id
        ON dbo.transaction_payer_snapshots(transaction_id, snapshot_version DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_payer_snapshots_document_hash'
      AND object_id = OBJECT_ID('dbo.transaction_payer_snapshots')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_payer_snapshots_document_hash
        ON dbo.transaction_payer_snapshots(document_hash);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_installments_transaction_id'
      AND object_id = OBJECT_ID('dbo.installments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_installments_transaction_id
        ON dbo.installments(transaction_id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_installments_transaction_id_status'
      AND object_id = OBJECT_ID('dbo.installments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_installments_transaction_id_status
        ON dbo.installments(transaction_id, status);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_installments_due_date'
      AND object_id = OBJECT_ID('dbo.installments')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_installments_due_date
        ON dbo.installments(due_date);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_sync_runs_source_name_started_at'
      AND object_id = OBJECT_ID('dbo.sync_runs')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_sync_runs_source_name_started_at
        ON dbo.sync_runs(source_name, started_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_status_history_transaction_id_changed_at'
      AND object_id = OBJECT_ID('dbo.transaction_status_history')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_status_history_transaction_id_changed_at
        ON dbo.transaction_status_history(transaction_id, changed_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_events_transaction_id_occurred_at'
      AND object_id = OBJECT_ID('dbo.transaction_events')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_events_transaction_id_occurred_at
        ON dbo.transaction_events(transaction_id, occurred_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_integration_evidences_transaction_id_captured_at'
      AND object_id = OBJECT_ID('dbo.transaction_integration_evidences')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_transaction_id_captured_at
        ON dbo.transaction_integration_evidences(transaction_id, captured_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_integration_evidences_psp_external_id_captured_at'
      AND object_id = OBJECT_ID('dbo.transaction_integration_evidences')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_psp_external_id_captured_at
        ON dbo.transaction_integration_evidences(psp, external_id, captured_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_transaction_integration_evidences_sync_run_id'
      AND object_id = OBJECT_ID('dbo.transaction_integration_evidences')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_sync_run_id
        ON dbo.transaction_integration_evidences(sync_run_id);
END;
GO