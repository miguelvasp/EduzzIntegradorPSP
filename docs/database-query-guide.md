# Guia de consultas ao banco de dados

## Objetivo

Este documento existe para facilitar a validação do banco durante desenvolvimento, testes e demonstração.

A ideia é simples:

- saber **quais tabelas devem ser preenchidas** em cada etapa;
- ter **selects prontos** para conferir execução, persistência, rejeição, conflito e rastreabilidade;
- reduzir improviso na hora de provar que o sistema realmente gravou o que deveria.

Banco alvo:

```sql
USE EduzzMultiPsp;
GO
```

---

## 1. Como cada grupo de tabelas deve ser preenchido

### No início de cada execução
Devem surgir registros em:

- `sync_runs`

### Ao iniciar cada PSP dentro da execução
Devem surgir registros em:

- `sync_run_sources`

### A cada página/lote consumido
Devem surgir registros em:

- `sync_run_pages`

### A cada item recebido do PSP, antes de adaptar/persistir
Devem surgir registros em:

- `sync_items`
- `psp_raw_payloads` com payload sanitizado

### Quando o item é válido e consolidado
Devem surgir ou ser atualizados registros em:

- `transactions`
- `installments`
- `payers`
- `transaction_payer_snapshots`
- `idempotency_registry`
- `sync_checkpoints`
- `outbox_messages`

### Quando houver rejeição de negócio
Devem surgir registros em:

- `sync_items` com `processing_result = 'rejected'`
- `validation_failures`
- `rejected_records`
- `processing_errors` quando aplicável

### Quando houver conflito
Devem surgir registros em:

- `sync_items` com `processing_result = 'conflicted'`
- `data_conflicts`
- `reconciliation_cases`
- `processing_errors` quando aplicável

### Quando houver erro técnico de integração com PSP
Devem surgir registros em:

- `integration_errors`

### Quando houver erro interno depois de receber payload
Devem surgir registros em:

- `processing_errors`

### Quando houver evidência e histórico relevante de mudança
Devem surgir registros em:

- `transaction_events`
- `transaction_status_history`
- `installment_status_history`
- `transaction_integration_evidences`

### O que não precisa entrar no fluxo principal agora
Essas tabelas existem, mas não são o centro da demonstração principal:

- `inbox_messages`
- `reconciliation_actions`

Se você tentar forçar isso agora sem precisar, vira dispersão.

---

## 2. Ordem recomendada de investigação no banco

Quando quiser validar uma execução, siga esta ordem:

1. `sync_runs`
2. `sync_run_sources`
3. `sync_run_pages`
4. `sync_items`
5. `psp_raw_payloads`
6. `transactions`
7. `installments`
8. `payers`
9. `transaction_payer_snapshots`
10. `sync_checkpoints`
11. `idempotency_registry`
12. `outbox_messages`
13. tabelas de rejeição / conflito / erro
14. tabelas de histórico e evidência

Essa ordem reduz confusão.

---

## 3. Consultas básicas de execução

## 3.1 Últimas execuções de sync

```sql
USE EduzzMultiPsp;
GO

SELECT TOP (20)
    id,
    source_name,
    trigger_type,
    status,
    requested_at,
    requested_by,
    started_at,
    finished_at,
    items_read,
    items_processed,
    items_succeeded,
    items_failed,
    error_count,
    error_summary,
    created_at
FROM dbo.sync_runs
ORDER BY id DESC;
```

## 3.2 Últimas execuções por fonte dentro da sync

```sql
SELECT TOP (50)
    id,
    sync_run_id,
    source_name,
    status,
    started_at,
    finished_at,
    items_read,
    items_processed,
    items_succeeded,
    items_failed,
    created_at
FROM dbo.sync_run_sources
ORDER BY id DESC;
```

## 3.3 Páginas consumidas por execução

```sql
SELECT TOP (100)
    id,
    sync_run_id,
    sync_run_source_id,
    page_number,
    page_size,
    cursor_value,
    offset_value,
    reference_value,
    started_at,
    finished_at,
    status,
    items_read,
    items_processed,
    created_at
FROM dbo.sync_run_pages
ORDER BY id DESC;
```

---

## 4. Consultas de itens recebidos e payload bruto

## 4.1 Itens recebidos na sync

```sql
SELECT TOP (200)
    id,
    sync_run_id,
    sync_run_source_id,
    sync_run_page_id,
    psp,
    external_id,
    resource_type,
    processing_result,
    transaction_id,
    received_at,
    processed_at,
    created_at
FROM dbo.sync_items
ORDER BY id DESC;
```

## 4.2 Itens recebidos por PSP e resultado

```sql
SELECT
    psp,
    processing_result,
    COUNT(*) AS total
FROM dbo.sync_items
GROUP BY
    psp,
    processing_result
ORDER BY
    psp,
    processing_result;
```

## 4.3 Payload bruto sanitizado

```sql
SELECT TOP (100)
    id,
    sync_item_id,
    sync_run_id,
    psp,
    external_id,
    payload_type,
    payload_hash,
    sanitized_at,
    created_at
FROM dbo.psp_raw_payloads
ORDER BY id DESC;
```

## 4.4 Payload bruto completo para inspecionar um item

```sql
SELECT TOP (20)
    id,
    sync_item_id,
    sync_run_id,
    psp,
    external_id,
    payload_type,
    payload_hash,
    payload_json,
    sanitized_at,
    created_at
FROM dbo.psp_raw_payloads
WHERE external_id = 'or_pag_001'
ORDER BY id DESC;
```

Troque o `external_id` pelo valor que você quiser investigar.

---

## 5. Consultas de consolidação do estado atual

## 5.1 Transações consolidadas

```sql
SELECT TOP (100)
    id,
    psp,
    external_id,
    status,
    payment_method,
    original_amount,
    net_amount,
    fees,
    installment_count,
    currency,
    payer_id,
    psp_created_at,
    psp_updated_at,
    first_seen_at,
    last_synced_at,
    last_status_changed_at,
    is_reconciled,
    created_at,
    updated_at
FROM dbo.transactions
ORDER BY id DESC;
```

## 5.2 Parcelas consolidadas

```sql
SELECT TOP (200)
    id,
    transaction_id,
    installment_number,
    amount,
    fees,
    status,
    due_date,
    paid_at,
    created_at,
    updated_at
FROM dbo.installments
ORDER BY id DESC;
```

## 5.3 Pagadores consolidados

```sql
SELECT TOP (100)
    id,
    psp,
    external_id,
    name,
    email,
    document_hash,
    document_type,
    has_document,
    created_at,
    updated_at
FROM dbo.payers
ORDER BY id DESC;
```

## 5.4 Snapshot do pagador por transação

```sql
SELECT TOP (200)
    id,
    transaction_id,
    payer_id,
    psp,
    external_id,
    name,
    email,
    document_hash,
    document_type,
    snapshot_version,
    captured_at,
    created_at
FROM dbo.transaction_payer_snapshots
ORDER BY id DESC;
```

## 5.5 Visão consolidada de transação + pagador

```sql
SELECT TOP (100)
    t.id AS transaction_id,
    t.psp,
    t.external_id,
    t.status,
    t.original_amount,
    t.net_amount,
    t.fees,
    t.installment_count,
    t.currency,
    t.psp_created_at,
    t.psp_updated_at,
    t.last_synced_at,
    p.id AS payer_id,
    p.external_id AS payer_external_id,
    p.name AS payer_name,
    p.email AS payer_email,
    p.document_hash,
    p.document_type,
    p.has_document
FROM dbo.transactions t
LEFT JOIN dbo.payers p
    ON p.id = t.payer_id
ORDER BY t.id DESC;
```

## 5.6 Visão consolidada de transação + parcelas

```sql
SELECT
    t.id AS transaction_id,
    t.psp,
    t.external_id,
    i.id AS installment_id,
    i.installment_number,
    i.amount,
    i.fees,
    i.status,
    i.due_date,
    i.paid_at,
    i.updated_at
FROM dbo.transactions t
INNER JOIN dbo.installments i
    ON i.transaction_id = t.id
ORDER BY
    t.id DESC,
    i.installment_number ASC;
```

---

## 6. Consultas de idempotência, checkpoint e outbox

## 6.1 Registro de idempotência

```sql
SELECT TOP (200)
    id,
    scope,
    idempotency_key,
    resource_type,
    resource_id,
    request_fingerprint,
    status,
    first_seen_at,
    last_seen_at,
    expires_at
FROM dbo.idempotency_registry
ORDER BY id DESC;
```

## 6.2 Checkpoints de sync

```sql
SELECT TOP (100)
    id,
    source_name,
    checkpoint_type,
    checkpoint_value,
    checkpoint_at,
    last_successful_run_id,
    updated_at
FROM dbo.sync_checkpoints
ORDER BY id DESC;
```

## 6.3 Outbox gerado

```sql
SELECT TOP (100)
    id,
    event_type,
    aggregate_type,
    aggregate_id,
    status,
    created_at,
    available_at,
    processed_at,
    correlation_id,
    sync_run_id,
    retry_count,
    last_error
FROM dbo.outbox_messages
ORDER BY created_at DESC;
```

---

## 7. Consultas de rejeição

## 7.1 Itens rejeitados

```sql
SELECT TOP (100)
    id,
    sync_run_id,
    psp,
    external_id,
    resource_type,
    processing_result,
    transaction_id,
    received_at,
    processed_at
FROM dbo.sync_items
WHERE processing_result = 'rejected'
ORDER BY id DESC;
```

## 7.2 Falhas de validação

```sql
SELECT TOP (100)
    id,
    sync_item_id,
    transaction_id,
    psp,
    external_id,
    failure_type,
    failure_code,
    failure_message,
    created_at
FROM dbo.validation_failures
ORDER BY id DESC;
```

## 7.3 Registros rejeitados consolidados

```sql
SELECT TOP (100)
    id,
    sync_item_id,
    validation_failure_id,
    sync_run_id,
    psp,
    external_id,
    rejection_type,
    rejection_reason,
    created_at
FROM dbo.rejected_records
ORDER BY id DESC;
```

## 7.4 Roteiro de investigação de rejeição

Use esta consulta quando quiser seguir o fluxo completo:

```sql
SELECT TOP (100)
    si.id AS sync_item_id,
    si.sync_run_id,
    si.psp,
    si.external_id,
    si.processing_result,
    vf.id AS validation_failure_id,
    vf.failure_type,
    vf.failure_code,
    vf.failure_message,
    rr.id AS rejected_record_id,
    rr.rejection_type,
    rr.rejection_reason,
    pe.id AS processing_error_id,
    pe.processing_stage,
    pe.error_code,
    pe.error_message
FROM dbo.sync_items si
LEFT JOIN dbo.validation_failures vf
    ON vf.sync_item_id = si.id
LEFT JOIN dbo.rejected_records rr
    ON rr.sync_item_id = si.id
LEFT JOIN dbo.processing_errors pe
    ON pe.sync_item_id = si.id
WHERE si.processing_result = 'rejected'
ORDER BY si.id DESC;
```

---

## 8. Consultas de conflito

## 8.1 Itens conflitantes

```sql
SELECT TOP (100)
    id,
    sync_run_id,
    psp,
    external_id,
    resource_type,
    processing_result,
    transaction_id,
    received_at,
    processed_at
FROM dbo.sync_items
WHERE processing_result = 'conflicted'
ORDER BY id DESC;
```

## 8.2 Conflitos detectados

```sql
SELECT TOP (100)
    id,
    sync_item_id,
    psp_raw_payload_id,
    transaction_id,
    psp,
    external_id,
    conflict_type,
    conflict_status,
    severity,
    detected_at,
    created_at
FROM dbo.data_conflicts
ORDER BY id DESC;
```

## 8.3 Casos de reconciliação

```sql
SELECT TOP (100)
    id,
    data_conflict_id,
    sync_item_id,
    transaction_id,
    psp,
    external_id,
    case_type,
    case_status,
    severity,
    opened_at,
    resolved_at,
    created_at
FROM dbo.reconciliation_cases
ORDER BY id DESC;
```

## 8.4 Roteiro de investigação de conflito

```sql
SELECT TOP (100)
    si.id AS sync_item_id,
    si.sync_run_id,
    si.psp,
    si.external_id,
    si.processing_result,
    dc.id AS conflict_id,
    dc.conflict_type,
    dc.conflict_status,
    dc.severity,
    dc.existing_value,
    dc.incoming_value,
    rc.id AS reconciliation_case_id,
    rc.case_type,
    rc.case_status,
    rc.severity AS case_severity,
    pe.id AS processing_error_id,
    pe.processing_stage,
    pe.error_code,
    pe.error_message
FROM dbo.sync_items si
LEFT JOIN dbo.data_conflicts dc
    ON dc.sync_item_id = si.id
LEFT JOIN dbo.reconciliation_cases rc
    ON rc.sync_item_id = si.id
LEFT JOIN dbo.processing_errors pe
    ON pe.sync_item_id = si.id
WHERE si.processing_result = 'conflicted'
ORDER BY si.id DESC;
```

---

## 9. Consultas de erro técnico

## 9.1 Erros de integração externa

```sql
SELECT TOP (100)
    id,
    sync_run_id,
    sync_run_source_id,
    sync_run_page_id,
    sync_item_id,
    psp,
    error_type,
    error_code,
    error_message,
    retryable,
    occurred_at,
    created_at
FROM dbo.integration_errors
ORDER BY id DESC;
```

## 9.2 Erros internos de processamento

```sql
SELECT TOP (100)
    id,
    sync_run_id,
    sync_item_id,
    transaction_id,
    processing_stage,
    error_code,
    error_message,
    retryable,
    occurred_at,
    created_at
FROM dbo.processing_errors
ORDER BY id DESC;
```

## 9.3 Erros por execução

```sql
SELECT
    sync_run_id,
    COUNT(*) AS total_processing_errors
FROM dbo.processing_errors
GROUP BY sync_run_id
ORDER BY sync_run_id DESC;
```

---

## 10. Consultas de histórico e evidência

## 10.1 Histórico de status da transação

```sql
SELECT TOP (200)
    id,
    transaction_id,
    previous_status,
    new_status,
    status_source,
    changed_at,
    sync_run_id,
    reason_code,
    notes,
    created_at
FROM dbo.transaction_status_history
ORDER BY id DESC;
```

## 10.2 Eventos de transação

```sql
SELECT TOP (200)
    id,
    transaction_id,
    event_type,
    event_status,
    occurred_at,
    sync_run_id,
    payload_hash,
    created_at
FROM dbo.transaction_events
ORDER BY id DESC;
```

## 10.3 Evidências de integração

```sql
SELECT TOP (200)
    id,
    transaction_id,
    psp,
    external_id,
    resource_type,
    resource_id,
    capture_type,
    captured_at,
    sync_run_id,
    http_status_code,
    payload_hash,
    is_latest,
    created_at
FROM dbo.transaction_integration_evidences
ORDER BY id DESC;
```

## 10.4 Histórico de status da parcela

```sql
SELECT TOP (200)
    id,
    installment_id,
    previous_status,
    new_status,
    status_source,
    changed_at,
    sync_run_id,
    reason_code,
    notes,
    created_at
FROM dbo.installment_status_history
ORDER BY id DESC;
```

---

## 11. Consultas de sanidade operacional

## 11.1 Contagem por tabela principal

```sql
SELECT 'sync_runs' AS table_name, COUNT(*) AS total FROM dbo.sync_runs
UNION ALL
SELECT 'sync_run_sources', COUNT(*) FROM dbo.sync_run_sources
UNION ALL
SELECT 'sync_run_pages', COUNT(*) FROM dbo.sync_run_pages
UNION ALL
SELECT 'sync_items', COUNT(*) FROM dbo.sync_items
UNION ALL
SELECT 'psp_raw_payloads', COUNT(*) FROM dbo.psp_raw_payloads
UNION ALL
SELECT 'transactions', COUNT(*) FROM dbo.transactions
UNION ALL
SELECT 'installments', COUNT(*) FROM dbo.installments
UNION ALL
SELECT 'payers', COUNT(*) FROM dbo.payers
UNION ALL
SELECT 'transaction_payer_snapshots', COUNT(*) FROM dbo.transaction_payer_snapshots
UNION ALL
SELECT 'idempotency_registry', COUNT(*) FROM dbo.idempotency_registry
UNION ALL
SELECT 'sync_checkpoints', COUNT(*) FROM dbo.sync_checkpoints
UNION ALL
SELECT 'outbox_messages', COUNT(*) FROM dbo.outbox_messages
UNION ALL
SELECT 'validation_failures', COUNT(*) FROM dbo.validation_failures
UNION ALL
SELECT 'rejected_records', COUNT(*) FROM dbo.rejected_records
UNION ALL
SELECT 'data_conflicts', COUNT(*) FROM dbo.data_conflicts
UNION ALL
SELECT 'reconciliation_cases', COUNT(*) FROM dbo.reconciliation_cases
UNION ALL
SELECT 'integration_errors', COUNT(*) FROM dbo.integration_errors
UNION ALL
SELECT 'processing_errors', COUNT(*) FROM dbo.processing_errors
UNION ALL
SELECT 'transaction_events', COUNT(*) FROM dbo.transaction_events
UNION ALL
SELECT 'transaction_status_history', COUNT(*) FROM dbo.transaction_status_history
UNION ALL
SELECT 'installment_status_history', COUNT(*) FROM dbo.installment_status_history
UNION ALL
SELECT 'transaction_integration_evidences', COUNT(*) FROM dbo.transaction_integration_evidences
ORDER BY table_name;
```

## 11.2 Verificar duplicidade indevida por transação externa

```sql
SELECT
    psp,
    external_id,
    COUNT(*) AS total
FROM dbo.transactions
GROUP BY
    psp,
    external_id
HAVING COUNT(*) > 1
ORDER BY total DESC;
```

O esperado é **zero linhas**.

## 11.3 Verificar se existe documento puro armazenado em `payers`

A tabela correta usa `document_hash`, não documento puro.

```sql
SELECT TOP (50)
    id,
    psp,
    external_id,
    name,
    email,
    document_hash,
    document_type,
    has_document
FROM dbo.payers
ORDER BY id DESC;
```

O que você deve ver:
- `document_hash` com hash
- nenhum campo de documento puro

---

## 12. Consultas por transação específica

## 12.1 Roteiro completo por `psp` + `external_id`

Troque os filtros do `WHERE` pelo caso que você quer seguir.

```sql
SELECT TOP (1)
    t.id,
    t.psp,
    t.external_id,
    t.status,
    t.original_amount,
    t.net_amount,
    t.fees,
    t.installment_count,
    t.currency,
    t.payer_id,
    t.psp_created_at,
    t.psp_updated_at,
    t.last_synced_at
FROM dbo.transactions t
WHERE t.psp = 'pagarme'
  AND t.external_id = 'or_pag_001';
```

### Parcelas da transação

```sql
SELECT
    i.id,
    i.transaction_id,
    i.installment_number,
    i.amount,
    i.fees,
    i.status,
    i.due_date,
    i.paid_at,
    i.updated_at
FROM dbo.installments i
WHERE i.transaction_id = 1
ORDER BY i.installment_number;
```

### Pagador da transação

```sql
SELECT
    p.id,
    p.psp,
    p.external_id,
    p.name,
    p.email,
    p.document_hash,
    p.document_type,
    p.has_document
FROM dbo.transactions t
INNER JOIN dbo.payers p
    ON p.id = t.payer_id
WHERE t.id = 1;
```

### Histórico e evidência da transação

```sql
SELECT
    tsh.id,
    tsh.previous_status,
    tsh.new_status,
    tsh.status_source,
    tsh.changed_at,
    tsh.reason_code,
    tsh.notes
FROM dbo.transaction_status_history tsh
WHERE tsh.transaction_id = 1
ORDER BY tsh.id DESC;

SELECT
    tie.id,
    tie.psp,
    tie.external_id,
    tie.resource_type,
    tie.capture_type,
    tie.http_status_code,
    tie.captured_at,
    tie.is_latest
FROM dbo.transaction_integration_evidences tie
WHERE tie.transaction_id = 1
ORDER BY tie.id DESC;
```

---

## 13. Roteiro prático de demo no banco

Se quiser uma sequência curta para demonstrar no banco depois da sync, use esta:

### Passo 1 — mostrar a última execução
```sql
SELECT TOP (5)
    id,
    source_name,
    status,
    started_at,
    finished_at,
    items_read,
    items_processed,
    items_succeeded,
    items_failed
FROM dbo.sync_runs
ORDER BY id DESC;
```

### Passo 2 — mostrar a fonte e as páginas
```sql
SELECT TOP (20)
    id,
    sync_run_id,
    source_name,
    status,
    items_read,
    items_processed,
    items_succeeded,
    items_failed
FROM dbo.sync_run_sources
ORDER BY id DESC;

SELECT TOP (20)
    id,
    sync_run_id,
    sync_run_source_id,
    page_number,
    page_size,
    status,
    items_read,
    items_processed
FROM dbo.sync_run_pages
ORDER BY id DESC;
```

### Passo 3 — mostrar os itens recebidos
```sql
SELECT TOP (20)
    id,
    sync_run_id,
    psp,
    external_id,
    resource_type,
    processing_result,
    transaction_id
FROM dbo.sync_items
ORDER BY id DESC;
```

### Passo 4 — mostrar a consolidação
```sql
SELECT TOP (20)
    id,
    psp,
    external_id,
    status,
    original_amount,
    net_amount,
    fees,
    installment_count,
    payer_id
FROM dbo.transactions
ORDER BY id DESC;
```

### Passo 5 — mostrar pagador e parcelas
```sql
SELECT TOP (20)
    id,
    external_id,
    name,
    email,
    document_hash,
    document_type,
    has_document
FROM dbo.payers
ORDER BY id DESC;

SELECT TOP (20)
    id,
    transaction_id,
    installment_number,
    amount,
    fees,
    status
FROM dbo.installments
ORDER BY id DESC;
```

### Passo 6 — mostrar checkpoint e idempotência
```sql
SELECT TOP (20)
    id,
    source_name,
    checkpoint_type,
    checkpoint_value,
    checkpoint_at,
    last_successful_run_id
FROM dbo.sync_checkpoints
ORDER BY id DESC;

SELECT TOP (20)
    id,
    scope,
    idempotency_key,
    resource_type,
    resource_id,
    status,
    first_seen_at,
    last_seen_at
FROM dbo.idempotency_registry
ORDER BY id DESC;
```

---

## 14. Observação final

Este guia não existe para você decorar consulta.

Ele existe para te dar um **roteiro disciplinado** de prova no banco:
- execução;
- item;
- payload;
- consolidação;
- rejeição;
- conflito;
- erro;
- histórico;
- evidência.

Se você usar isso na demo, a chance de ficar perdido nas tabelas cai muito.
