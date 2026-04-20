USE EduzzMultiPsp;
GO

CREATE TABLE dbo.payers
(
    id BIGINT IDENTITY(1,1) NOT NULL,
    psp NVARCHAR(30) NOT NULL,
    external_id NVARCHAR(100) NULL,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    document_hash CHAR(64) NOT NULL,
    document_type NVARCHAR(20) NOT NULL,
    has_document BIT NOT NULL CONSTRAINT DF_payers_has_document DEFAULT (1),
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_payers_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_payers_updated_at DEFAULT (SYSUTCDATETIME()),
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_payers PRIMARY KEY CLUSTERED (id),
    CONSTRAINT CK_payers_document_type CHECK (document_type IN ('cpf', 'cnpj', 'unknown')),
    CONSTRAINT CK_payers_name_not_blank CHECK (LEN(LTRIM(RTRIM(name))) > 0),
    CONSTRAINT CK_payers_email_not_blank CHECK (LEN(LTRIM(RTRIM(email))) > 0)
);
GO

CREATE TABLE dbo.transactions
(
    id BIGINT IDENTITY(1,1) NOT NULL,
    psp NVARCHAR(30) NOT NULL,
    external_id NVARCHAR(100) NOT NULL,
    status NVARCHAR(40) NOT NULL,
    payment_method NVARCHAR(30) NOT NULL,
    original_amount BIGINT NOT NULL,
    net_amount BIGINT NOT NULL,
    fees BIGINT NOT NULL,
    installment_count INT NOT NULL,
    currency CHAR(3) NOT NULL,
    payer_id BIGINT NULL,
    psp_created_at DATETIME2(3) NOT NULL,
    psp_updated_at DATETIME2(3) NOT NULL,
    first_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_transactions_first_seen_at DEFAULT (SYSUTCDATETIME()),
    last_synced_at DATETIME2(3) NULL,
    last_status_changed_at DATETIME2(3) NULL,
    is_reconciled BIT NOT NULL CONSTRAINT DF_transactions_is_reconciled DEFAULT (0),
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transactions_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_transactions_updated_at DEFAULT (SYSUTCDATETIME()),
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_transactions PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_transactions_psp_external_id UNIQUE (psp, external_id),
    CONSTRAINT CK_transactions_status CHECK (status IN ('pending', 'paid', 'canceled', 'refunded', 'failed', 'disputed', 'partially_refunded', 'unknown')),
    CONSTRAINT CK_transactions_payment_method CHECK (payment_method = 'credit_card'),
    CONSTRAINT CK_transactions_original_amount CHECK (original_amount >= 0),
    CONSTRAINT CK_transactions_net_amount CHECK (net_amount >= 0),
    CONSTRAINT CK_transactions_fees CHECK (fees >= 0),
    CONSTRAINT CK_transactions_installment_count CHECK (installment_count > 0),
    CONSTRAINT CK_transactions_currency CHECK (currency IN ('BRL')),
    CONSTRAINT FK_transactions_payer_id FOREIGN KEY (payer_id) REFERENCES dbo.payers(id)
);
GO

CREATE TABLE dbo.transaction_payer_snapshots
(
    id BIGINT IDENTITY(1,1) NOT NULL,
    transaction_id BIGINT NOT NULL,
    payer_id BIGINT NULL,
    psp NVARCHAR(30) NOT NULL,
    external_id NVARCHAR(100) NULL,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    document_hash CHAR(64) NOT NULL,
    document_type NVARCHAR(20) NOT NULL,
    snapshot_version INT NOT NULL CONSTRAINT DF_transaction_payer_snapshots_snapshot_version DEFAULT (1),
    captured_at DATETIME2(3) NOT NULL CONSTRAINT DF_transaction_payer_snapshots_captured_at DEFAULT (SYSUTCDATETIME()),
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transaction_payer_snapshots_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_transaction_payer_snapshots PRIMARY KEY CLUSTERED (id),
    CONSTRAINT CK_transaction_payer_snapshots_document_type CHECK (document_type IN ('cpf', 'cnpj', 'unknown')),
    CONSTRAINT CK_transaction_payer_snapshots_snapshot_version CHECK (snapshot_version > 0),
    CONSTRAINT CK_transaction_payer_snapshots_name_not_blank CHECK (LEN(LTRIM(RTRIM(name))) > 0),
    CONSTRAINT CK_transaction_payer_snapshots_email_not_blank CHECK (LEN(LTRIM(RTRIM(email))) > 0),
    CONSTRAINT FK_transaction_payer_snapshots_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id),
    CONSTRAINT FK_transaction_payer_snapshots_payer_id FOREIGN KEY (payer_id) REFERENCES dbo.payers(id)
);
GO

CREATE TABLE dbo.installments
(
    id BIGINT IDENTITY(1,1) NOT NULL,
    transaction_id BIGINT NOT NULL,
    installment_number INT NOT NULL,
    amount BIGINT NOT NULL,
    fees BIGINT NOT NULL,
    status NVARCHAR(40) NOT NULL,
    due_date DATETIME2(3) NULL,
    paid_at DATETIME2(3) NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_installments_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_installments_updated_at DEFAULT (SYSUTCDATETIME()),
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_installments PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_installments_transaction_id_installment_number UNIQUE (transaction_id, installment_number),
    CONSTRAINT CK_installments_installment_number CHECK (installment_number > 0),
    CONSTRAINT CK_installments_amount CHECK (amount >= 0),
    CONSTRAINT CK_installments_fees CHECK (fees >= 0),
    CONSTRAINT CK_installments_status CHECK (status IN ('pending', 'paid', 'canceled', 'failed', 'refunded', 'scheduled', 'unknown')),
    CONSTRAINT FK_installments_transaction_id FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id)
);
GO
