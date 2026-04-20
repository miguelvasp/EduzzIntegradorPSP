USE EduzzMultiPsp;
GO

CREATE UNIQUE NONCLUSTERED INDEX UX_payers_psp_external_id
    ON dbo.payers(psp, external_id)
    WHERE external_id IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_payers_document_hash
    ON dbo.payers(document_hash);
GO

CREATE NONCLUSTERED INDEX IX_payers_email
    ON dbo.payers(email);
GO

CREATE NONCLUSTERED INDEX IX_transactions_psp_status_psp_created_at
    ON dbo.transactions(psp, status, psp_created_at DESC)
    INCLUDE (currency, original_amount, net_amount, fees, installment_count, payer_id);
GO

CREATE NONCLUSTERED INDEX IX_transactions_psp_created_at
    ON dbo.transactions(psp, psp_created_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transactions_status_psp_created_at
    ON dbo.transactions(status, psp_created_at DESC)
    INCLUDE (psp, currency, original_amount, net_amount, fees, installment_count);
GO

CREATE NONCLUSTERED INDEX IX_transactions_payer_id
    ON dbo.transactions(payer_id);
GO

CREATE NONCLUSTERED INDEX IX_transactions_last_synced_at
    ON dbo.transactions(last_synced_at);
GO

CREATE UNIQUE NONCLUSTERED INDEX UX_transaction_payer_snapshots_transaction_id_snapshot_version
    ON dbo.transaction_payer_snapshots(transaction_id, snapshot_version);
GO

CREATE NONCLUSTERED INDEX IX_transaction_payer_snapshots_transaction_id
    ON dbo.transaction_payer_snapshots(transaction_id, snapshot_version DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_payer_snapshots_document_hash
    ON dbo.transaction_payer_snapshots(document_hash);
GO

CREATE NONCLUSTERED INDEX IX_installments_transaction_id
    ON dbo.installments(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_installments_transaction_id_status
    ON dbo.installments(transaction_id, status);
GO

CREATE NONCLUSTERED INDEX IX_installments_due_date
    ON dbo.installments(due_date);
GO

CREATE NONCLUSTERED INDEX IX_sync_runs_source_name_started_at
    ON dbo.sync_runs(source_name, started_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_status_history_transaction_id_changed_at
    ON dbo.transaction_status_history(transaction_id, changed_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_events_transaction_id_occurred_at
    ON dbo.transaction_events(transaction_id, occurred_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_transaction_id_captured_at
    ON dbo.transaction_integration_evidences(transaction_id, captured_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_psp_external_id_captured_at
    ON dbo.transaction_integration_evidences(psp, external_id, captured_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_transaction_integration_evidences_sync_run_id
    ON dbo.transaction_integration_evidences(sync_run_id);
GO
