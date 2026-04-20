# Domain Model

## Objetivo

O modulo `transactions` define um modelo de dominio canonico para transacoes de cartao de credito, desacoplado dos contratos externos dos PSPs e preparado para persistencia, consulta, sincronizacao, auditoria e reconciliacao futuras.

## Principios do dominio

- o dominio canonico nao replica payloads externos
- a identidade semantica da transacao e `psp + externalId`
- documento de pagador existe apenas como hash
- dados auditaveis e dados atualizaveis possuem papeis distintos
- regras minimas de consistencia devem existir antes de qualquer persistencia futura
- cada campo possui uma unica fonte de verdade no aggregate root

## Entidades centrais

### Transaction

Representa a raiz agregadora canonica.

Responsabilidades:

- manter identidade interna e referencia externa idempotente
- representar status canonico da transacao
- consolidar valores financeiros base
- relacionar snapshot canonico do pagador e parcelas
- expor apenas uma fonte de verdade por campo
- carregar metadados operacionais minimos quando existirem

Campos centrais:

- `id`
- `externalReference`
- `paymentMethod`
- `status`
- `originalAmount`
- `netAmount`
- `fees`
- `installmentCount`
- `currency`
- `createdAt`
- `updatedAt`
- `payerSnapshot`
- `installments`
- `metadata`

### Installment

Representa a parcela canonica associada a uma transacao.

Responsabilidades:

- manter ordenacao de parcela
- representar valor, taxas e status da parcela
- carregar datas relevantes de vencimento e pagamento
- preservar vinculo semantico com a transacao

Campos centrais:

- `id`
- `transactionId`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `dueDate`
- `paidAt`

### PayerSnapshot

Representa o snapshot canonico do pagador observado no momento da transacao.

Responsabilidades:

- preservar estabilidade historica dos dados do pagador ligados a transacao
- manter identificacao minima do pagador
- preservar `externalId` quando existir
- armazenar apenas `documentHash`
- indicar `documentType`

Campos centrais:

- `externalId`
- `name`
- `email`
- `documentHash`
- `documentType`

## Relacionamentos

- uma `Transaction` possui um `PayerSnapshot`
- uma `Transaction` possui uma colecao de `Installment`
- cada `Installment` pertence a uma unica `Transaction`

## Regras minimas de validade

A policy `transaction-validity.policy.ts` considera uma transacao valida para ingestao no modelo canonico somente quando:

- esta no escopo de cartao de credito
- possui `externalReference` valido com `psp` e `externalId`
- possui `payerSnapshot` com nome, email, `documentHash` e `documentType`
- possui ao menos uma parcela
- possui colecao de parcelas completa e consistente com `installmentCount`
- possui numeracao unica e sequencia fechada de `1` ate `installmentCount`, sem depender da ordem do array
- possui moedas financeiras coerentes com a moeda canonica da transacao
- possui datas basicas coerentes para transacao e parcelas

## Distincao entre auditavel e atualizavel

Auditaveis:

- `externalReference`
- `createdAt`
- `currency`
- `installmentCount`
- `originalAmount`
- `netAmount`
- `fees`
- `payerSnapshot`

Atualizaveis:

- `status`
- `updatedAt`
- `installments`
- `metadata`

Essa separacao formaliza o que deve ser preservado como base historica e o que pode evoluir com novas sincronizacoes ou consolidacoes futuras.
