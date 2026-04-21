# Status Transition and Safe Merge

## Objetivo

Consolidar atualizações de transações sem sobrescrever cegamente campos auditáveis e sem aceitar regressão indevida de status.

## Estrutura

### TransactionStatusTransitionPolicy

Responsável por avaliar a mudança entre:

- status atual
- status novo

Saídas possíveis:

- `valid`
- `equivalent`
- `suspicious`
- `invalid`

## Regras mínimas atuais

### Válidas

- `pending -> paid`
- `pending -> canceled`
- `paid -> refunded`
- `paid -> partially_refunded`

### Equivalentes

- `paid -> paid`
- `pending -> pending`

### Suspeitas

- `unknown -> qualquer status conhecido`
- transições não explicitamente reconhecidas

### Inválidas

- `paid -> pending`
- `refunded -> paid`
- `canceled -> paid`

## TransactionMergePolicy

Responsável por decidir como consolidar a nova versão da transação.

Saídas possíveis:

- `no_change`
- `safe_update`
- `partial_update`
- `conflict_detected`
- `reconciliation_required`

## Grupos de campo

### Auditáveis

Não devem ser sobrescritos automaticamente:

- `externalReference.psp`
- `externalReference.externalId`
- `createdAt`

### Financeiros sensíveis

Divergência gera conflito:

- `originalAmount`
- `netAmount`
- `fees`
- `installmentCount`

### Identidade do pagador

Mudança material gera conflito:

- `documentHash`
- `documentType`

### Atualizáveis operacionais

Podem ser atualizados de forma controlada:

- `status`
- `updatedAt`
- `payerSnapshot.name`
- `payerSnapshot.email`

## ConflictClassifier

Responsável por classificar o tipo principal da divergência:

- `audit_field_divergence`
- `financial_divergence`
- `payer_identity_divergence`
- `installment_divergence`
- `invalid_status_regression`

## Regra importante

Idempotência responde se o item já existe.

Merge seguro responde o que fazer com a nova versão recebida.

Essas decisões não são a mesma coisa.
