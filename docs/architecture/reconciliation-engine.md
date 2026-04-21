# Reconciliation Engine

## Objetivo

Abrir e classificar casos de reconciliação quando a divergência recebida não puder ser tratada com update seguro, rejeição simples ou duplicidade equivalente.

## Papel do motor

O motor de reconciliação atua depois da detecção de conflito relevante no fluxo de ingestão.

Ele decide:

- tipo do caso
- severidade
- status inicial
- ação inicial
- se há auto-resolução segura
- se o caso fica pendente de reprocessamento ou revisão

## Componentes

### ReconciliationEngine

Responsável por transformar o tipo de conflito em decisão operacional de reconciliação.

### ReconciliationSeverityClassifier

Responsável por classificar a severidade do caso.

### ReconciliationCaseService

Responsável por abrir o caso e devolver a estrutura inicial rastreável.

### ReconciliationActionRecorder

Responsável por registrar a primeira ação do caso.

## Tipos mínimos de caso

- `financial_divergence`
- `status_inconsistency`
- `out_of_order_event`
- `audit_field_conflict`
- `payer_inconsistency`
- `installment_inconsistency`
- `unresolved_merge`

## Severidade mínima

- `low`
- `medium`
- `high`
- `critical`

## Regras iniciais

### Divergência financeira

- abre caso
- severidade `high`
- status `under_review`

### Regressão inválida de status

- abre caso
- severidade `high`
- status `under_review`

### Divergência de campo auditável

- abre caso
- severidade `critical`
- status `under_review`

### Divergência de pagador

- abre caso
- severidade `high`
- status `under_review`

### Divergência de parcelas

- abre caso
- severidade `medium`
- status `pending_reprocessing`

## Auto resolução

Só ocorre quando o conflito:

- já é conhecido
- é repetido
- tem resolução segura e rastreável

Não existe auto-resolução silenciosa para divergência material nova.

## Diferença importante

- rejeição: item não entra por regra de negócio
- conflito: divergência detectada
- reconciliação: caso aberto para tratar conflito relevante

Essas três coisas não são iguais.
