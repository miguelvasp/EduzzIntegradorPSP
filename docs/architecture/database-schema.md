# Database Schema

## Objetivo do schema

O schema fisico organiza a persistencia relacional do modelo canonico de transacoes, com separacao clara entre estado atual, operacao de sincronizacao, historico operacional e evidencia bruta de integracao.

## Convencoes adotadas

- schema padrao `dbo`
- chaves primarias com `BIGINT IDENTITY(1,1)`
- datas operacionais com `DATETIME2(3)`
- valores monetarios armazenados em centavos com `BIGINT`
- documento do pagador armazenado apenas como hash em `CHAR(64)`
- colunas de concorrencia otimista com `ROWVERSION` nas tabelas centrais que representam estado atual

## Scripts versionados

- `V001__create_database.sql`
  cria somente o banco `EduzzMultiPsp`
- `V002__create_core_transaction_tables.sql`
  cria `dbo.payers`, `dbo.transactions`, `dbo.transaction_payer_snapshots` e `dbo.installments`
- `V003__create_operational_tables.sql`
  cria `dbo.sync_runs`, `dbo.sync_checkpoints`, `dbo.idempotency_registry`, `dbo.transaction_status_history`, `dbo.transaction_events` e `dbo.transaction_integration_evidences`
- `V004__create_indexes.sql`
  cria somente os indices aprovados para consulta e operacao

## Tabelas centrais

### `dbo.payers`

PK:

- `id`

Colunas principais:

- `psp`
- `external_id`
- `name`
- `email`
- `document_hash`
- `document_type`
- `has_document`
- `created_at`
- `updated_at`
- `row_version`

Uniques e checks relevantes:

- `CK_payers_document_type`
- `CK_payers_name_not_blank`
- `CK_payers_email_not_blank`
- indice unico filtrado `UX_payers_psp_external_id` quando `external_id IS NOT NULL`

FKs:

- nenhuma

### `dbo.transactions`

PK:

- `id`

Colunas principais:

- `psp`
- `external_id`
- `status`
- `payment_method`
- `original_amount`
- `net_amount`
- `fees`
- `installment_count`
- `currency`
- `payer_id`
- `psp_created_at`
- `psp_updated_at`
- `first_seen_at`
- `last_synced_at`
- `last_status_changed_at`
- `is_reconciled`
- `created_at`
- `updated_at`
- `row_version`

Uniques e checks relevantes:

- `UQ_transactions_psp_external_id`
- `CK_transactions_status`
- `CK_transactions_payment_method`
- `CK_transactions_original_amount`
- `CK_transactions_net_amount`
- `CK_transactions_fees`
- `CK_transactions_installment_count`
- `CK_transactions_currency`

FKs:

- `FK_transactions_payer_id -> dbo.payers(id)`

Observacao relacional:

- `transactions` e unica por `(psp, external_id)`

### `dbo.transaction_payer_snapshots`

PK:

- `id`

Colunas principais:

- `transaction_id`
- `payer_id`
- `psp`
- `external_id`
- `name`
- `email`
- `document_hash`
- `document_type`
- `snapshot_version`
- `captured_at`
- `created_at`

Uniques e checks relevantes:

- `CK_transaction_payer_snapshots_document_type`
- `CK_transaction_payer_snapshots_snapshot_version`
- `CK_transaction_payer_snapshots_name_not_blank`
- `CK_transaction_payer_snapshots_email_not_blank`
- indice unico `UX_transaction_payer_snapshots_transaction_id_snapshot_version`

FKs:

- `FK_transaction_payer_snapshots_transaction_id -> dbo.transactions(id)`
- `FK_transaction_payer_snapshots_payer_id -> dbo.payers(id)`

Observacao relacional:

- preserva historico do pagador por transacao

### `dbo.installments`

PK:

- `id`

Colunas principais:

- `transaction_id`
- `installment_number`
- `amount`
- `fees`
- `status`
- `due_date`
- `paid_at`
- `created_at`
- `updated_at`
- `row_version`

Uniques e checks relevantes:

- `UQ_installments_transaction_id_installment_number`
- `CK_installments_installment_number`
- `CK_installments_amount`
- `CK_installments_fees`
- `CK_installments_status`

FKs:

- `FK_installments_transaction_id -> dbo.transactions(id)`

Observacao relacional:

- `installments` e unica por `(transaction_id, installment_number)`

## Tabelas operacionais

### `dbo.sync_runs`

Finalidade:

- registrar cada execucao de sincronizacao

PK e FKs:

- PK `id`
- sem FKs

### `dbo.sync_checkpoints`

Finalidade:

- guardar checkpoint incremental por fonte e tipo

PK e FKs:

- PK `id`
- FK `FK_sync_checkpoints_last_successful_run_id -> dbo.sync_runs(id)`
- unique `UQ_sync_checkpoints_source_name_checkpoint_type`

### `dbo.idempotency_registry`

Finalidade:

- registrar chaves tecnicas de idempotencia e seu estado

PK e FKs:

- PK `id`
- sem FKs
- unique `UQ_idempotency_registry_scope_idempotency_key`

### `dbo.transaction_status_history`

Finalidade:

- manter historico de mudancas de status

PK e FKs:

- PK `id`
- FK `FK_transaction_status_history_transaction_id -> dbo.transactions(id)`
- FK `FK_transaction_status_history_sync_run_id -> dbo.sync_runs(id)`

### `dbo.transaction_events`

Finalidade:

- registrar eventos operacionais da transacao

PK e FKs:

- PK `id`
- FK `FK_transaction_events_transaction_id -> dbo.transactions(id)`
- FK `FK_transaction_events_sync_run_id -> dbo.sync_runs(id)`
- check `CK_transaction_events_payload_json_is_json`

### `dbo.transaction_integration_evidences`

Finalidade:

- guardar JSON bruto do PSP e metadados da captura

PK e FKs:

- PK `id`
- FK `FK_transaction_integration_evidences_transaction_id -> dbo.transactions(id)`
- FK `FK_transaction_integration_evidences_sync_run_id -> dbo.sync_runs(id)`
- checks `CK_transaction_integration_evidences_http_status_code` e `CK_transaction_integration_evidences_payload_json_is_json`

## Estrategia de idempotencia relacional

- unicidade de transacao por `UQ_transactions_psp_external_id`
- controle tecnico complementar por `UQ_idempotency_registry_scope_idempotency_key`
- evidencia externa pode referenciar o mesmo `(psp, external_id)` sem substituir a linha consolidada de `transactions`

## Estrategia de snapshots do pagador

- `transactions.payer_id` aponta para o pagador consolidado quando houver correspondencia
- `transaction_payer_snapshots` preserva o contexto historico do pagador por transacao
- `snapshot_version` permite evolucao controlada do snapshot por transacao
- o documento do pagador nao e persistido em texto puro, apenas em `document_hash`

## Estrategia de evidencia JSON do PSP

- `transaction_events.payload_json` guarda JSON opcional de evento operacional, validado por `ISJSON`
- `transaction_integration_evidences.payload_json` guarda JSON bruto do PSP, tambem validado por `ISJSON`
- `payload_hash` apoia rastreabilidade tecnica da carga capturada
- essa evidencia fica separada das tabelas centrais para nao contaminar o modelo canonico

## Indices principais e motivacao

- `UX_payers_psp_external_id`
  evita duplicidade de pagador por PSP e id externo quando o id externo existe
- `IX_payers_document_hash`
  apoia busca por documento hasheado
- `IX_payers_email`
  apoia consulta operacional por email
- `IX_transactions_psp_status_psp_created_at`
  apoia filtros tipicos de API e sincronizacao por provedor, status e data de origem
- `IX_transactions_psp_created_at`
  apoia ordenacao e cortes incrementais por provedor
- `IX_transactions_status_psp_created_at`
  apoia consulta por status com ordenacao temporal
- `IX_transactions_payer_id`
  apoia navegacao relacional entre transacao e pagador
- `IX_transactions_last_synced_at`
  apoia leitura operacional do estado de sincronizacao
- `UX_transaction_payer_snapshots_transaction_id_snapshot_version`
  garante unicidade da versao do snapshot por transacao
- `IX_transaction_payer_snapshots_transaction_id`
  apoia leitura do snapshot mais recente por transacao
- `IX_transaction_payer_snapshots_document_hash`
  apoia rastreabilidade por documento hasheado
- `IX_installments_transaction_id`
  apoia leitura de parcelas por transacao
- `IX_installments_transaction_id_status`
  apoia filtros de parcelas por estado dentro da transacao
- `IX_installments_due_date`
  apoia leitura operacional por vencimento
- `IX_sync_runs_source_name_started_at`
  apoia consulta de execucoes por fonte e ordem temporal
- `IX_transaction_status_history_transaction_id_changed_at`
  apoia auditoria de status por transacao
- `IX_transaction_events_transaction_id_occurred_at`
  apoia trilha de eventos por transacao
- `IX_transaction_integration_evidences_transaction_id_captured_at`
  apoia rastreabilidade de evidencias por transacao
- `IX_transaction_integration_evidences_psp_external_id_captured_at`
  apoia busca de evidencia por identidade externa
- `IX_transaction_integration_evidences_sync_run_id`
  apoia analise de evidencias por execucao de sincronizacao

## Ordem de execucao local

1. executar `V001__create_database.sql`
2. executar `V002__create_core_transaction_tables.sql`
3. executar `V003__create_operational_tables.sql`
4. executar `V004__create_indexes.sql`

## Convencao de versionamento de migrations

- prefixo `V`
- numeracao sequencial crescente
- nome descritivo apos `__`
- cada arquivo deve representar uma unidade clara de evolucao do schema

## Pontos de evolucao futura

- ampliar o conjunto de moedas aceitas caso o dominio deixe de operar apenas com `BRL`
- detalhar politicas de retencao e arquivamento de evidencia JSON conforme volume operacional
- expandir indices apenas a partir de padroes reais de consulta e carga
