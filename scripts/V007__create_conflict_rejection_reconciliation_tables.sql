USE EduzzMultiPsp;
GO

IF OBJECT_ID('dbo.validation_failures', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.validation_failures
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_item_id BIGINT NOT NULL,
        transaction_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        failure_type NVARCHAR(50) NOT NULL,
        failure_code NVARCHAR(50) NULL,
        failure_message NVARCHAR(2000) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_validation_failures_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_validation_failures PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_validation_failures_failure_type CHECK (failure_type IN ('missing_payer', 'missing_installments', 'invalid_payment_method', 'missing_external_id', 'invalid_document', 'incomplete_transaction_data')),
        CONSTRAINT FK_validation_failures_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_validation_failures_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
    );
END;
GO

IF OBJECT_ID('dbo.rejected_records', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.rejected_records
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_item_id BIGINT NOT NULL,
        validation_failure_id BIGINT NULL,
        sync_run_id BIGINT NOT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        rejection_type NVARCHAR(80) NOT NULL,
        rejection_reason NVARCHAR(2000) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_rejected_records_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_rejected_records PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_rejected_records_rejection_type CHECK (rejection_type IN ('rejected_missing_payer', 'rejected_missing_installments', 'rejected_out_of_scope_payment_method', 'rejected_invalid_required_data')),
        CONSTRAINT FK_rejected_records_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_rejected_records_validation_failure_id FOREIGN KEY (validation_failure_id) REFERENCES dbo.validation_failures(id),
        CONSTRAINT FK_rejected_records_sync_run_id FOREIGN KEY (sync_run_id) REFERENCES dbo.sync_runs(id)
    );
END;
GO

IF OBJECT_ID('dbo.data_conflicts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.data_conflicts
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        sync_item_id BIGINT NOT NULL,
        psp_raw_payload_id BIGINT NULL,
        transaction_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        conflict_type NVARCHAR(80) NOT NULL,
        conflict_status NVARCHAR(30) NOT NULL,
        existing_value NVARCHAR(MAX) NULL,
        incoming_value NVARCHAR(MAX) NULL,
        severity NVARCHAR(20) NOT NULL,
        detected_at DATETIME2(3) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_data_conflicts_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_data_conflicts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_data_conflicts_conflict_type CHECK (conflict_type IN ('amount_mismatch', 'net_amount_mismatch', 'fees_mismatch', 'installment_count_mismatch', 'invalid_status_transition', 'out_of_order_event', 'payer_identity_mismatch', 'audit_field_overwrite_attempt')),
        CONSTRAINT CK_data_conflicts_conflict_status CHECK (conflict_status IN ('open', 'under_analysis', 'resolved', 'dismissed')),
        CONSTRAINT CK_data_conflicts_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        CONSTRAINT FK_data_conflicts_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_data_conflicts_psp_raw_payload_id FOREIGN KEY (psp_raw_payload_id) REFERENCES dbo.psp_raw_payloads(id),
        CONSTRAINT FK_data_conflicts_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
    );
END;
GO

IF OBJECT_ID('dbo.reconciliation_cases', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.reconciliation_cases
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        data_conflict_id BIGINT NULL,
        sync_item_id BIGINT NULL,
        transaction_id BIGINT NULL,
        psp NVARCHAR(30) NOT NULL,
        external_id NVARCHAR(100) NOT NULL,
        case_type NVARCHAR(50) NOT NULL,
        case_status NVARCHAR(30) NOT NULL,
        severity NVARCHAR(20) NOT NULL,
        opened_at DATETIME2(3) NOT NULL,
        resolved_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_reconciliation_cases_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_reconciliation_cases PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_reconciliation_cases_case_type CHECK (case_type IN ('financial_divergence', 'status_inconsistency', 'data_incompleteness', 'identity_inconsistency', 'unresolved_conflict')),
        CONSTRAINT CK_reconciliation_cases_case_status CHECK (case_status IN ('open', 'pending_reprocessing', 'under_review', 'auto_resolved', 'resolved', 'closed_without_change')),
        CONSTRAINT CK_reconciliation_cases_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        CONSTRAINT FK_reconciliation_cases_data_conflict_id FOREIGN KEY (data_conflict_id) REFERENCES dbo.data_conflicts(id),
        CONSTRAINT FK_reconciliation_cases_sync_item_id FOREIGN KEY (sync_item_id) REFERENCES dbo.sync_items(id),
        CONSTRAINT FK_reconciliation_cases_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
    );
END;
GO

IF OBJECT_ID('dbo.reconciliation_actions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.reconciliation_actions
    (
        id BIGINT IDENTITY(1,1) NOT NULL,
        reconciliation_case_id BIGINT NOT NULL,
        action_type NVARCHAR(50) NOT NULL,
        action_status NVARCHAR(30) NOT NULL,
        action_notes NVARCHAR(2000) NULL,
        acted_at DATETIME2(3) NOT NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_reconciliation_actions_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_reconciliation_actions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_reconciliation_actions_action_type CHECK (action_type IN ('opened', 'reprocessed', 'marked_for_review', 'auto_resolved', 'discarded', 'closed')),
        CONSTRAINT CK_reconciliation_actions_action_status CHECK (action_status IN ('requested', 'completed', 'failed')),
        CONSTRAINT FK_reconciliation_actions_reconciliation_case_id FOREIGN KEY (reconciliation_case_id) REFERENCES dbo.reconciliation_cases(id)
    );
END;
GO