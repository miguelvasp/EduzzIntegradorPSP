USE EduzzMultiPsp;
GO

CREATE NONCLUSTERED INDEX IX_validation_failures_sync_item_id
    ON dbo.validation_failures(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_validation_failures_transaction_id
    ON dbo.validation_failures(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_validation_failures_psp_failure_type_created_at
    ON dbo.validation_failures(psp, failure_type, created_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_rejected_records_sync_item_id
    ON dbo.rejected_records(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_rejected_records_validation_failure_id
    ON dbo.rejected_records(validation_failure_id);
GO

CREATE NONCLUSTERED INDEX IX_rejected_records_sync_run_id
    ON dbo.rejected_records(sync_run_id);
GO

CREATE NONCLUSTERED INDEX IX_rejected_records_psp_rejection_type_created_at
    ON dbo.rejected_records(psp, rejection_type, created_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_data_conflicts_sync_item_id
    ON dbo.data_conflicts(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_data_conflicts_psp_raw_payload_id
    ON dbo.data_conflicts(psp_raw_payload_id);
GO

CREATE NONCLUSTERED INDEX IX_data_conflicts_transaction_id
    ON dbo.data_conflicts(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_data_conflicts_conflict_type_status_detected_at
    ON dbo.data_conflicts(conflict_type, conflict_status, detected_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_data_conflicts_severity_status_detected_at
    ON dbo.data_conflicts(severity, conflict_status, detected_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_cases_data_conflict_id
    ON dbo.reconciliation_cases(data_conflict_id);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_cases_sync_item_id
    ON dbo.reconciliation_cases(sync_item_id);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_cases_transaction_id
    ON dbo.reconciliation_cases(transaction_id);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_cases_case_status_severity_opened_at
    ON dbo.reconciliation_cases(case_status, severity, opened_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_cases_case_type_case_status_opened_at
    ON dbo.reconciliation_cases(case_type, case_status, opened_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_actions_reconciliation_case_id
    ON dbo.reconciliation_actions(reconciliation_case_id);
GO

CREATE NONCLUSTERED INDEX IX_reconciliation_actions_action_type_action_status_acted_at
    ON dbo.reconciliation_actions(action_type, action_status, acted_at DESC);
GO