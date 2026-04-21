# Ingestion Idempotency

## Objetivo

Garantir que reprocessamentos, overlap incremental, retries e reimportações não gerem duplicidade física ou lógica na ingestão.

## Chave lógica

A chave mínima de idempotência é composta por:

- `psp`
- `externalId`

Essa combinação identifica de forma inequívoca a transação dentro do provedor de origem.

## Componentes

### IdempotencyKeyResolver

Responsável por derivar a chave lógica a partir da transação canônica.

### SafeMergePolicy

Responsável por distinguir:

- repetição equivalente
- update permitido
- conflito

### IdempotencyService

Responsável por:

- resolver a chave
- consultar existência prévia
- aplicar a política de merge seguro
- registrar a decisão idempotente

### IdempotencyRepository

Porta para:

- consultar transação existente pela chave
- registrar a decisão idempotente em estrutura técnica

## Resultado esperado por cenário

### inserted

Item ainda não conhecido.

### ignored_as_duplicate

Mesmo item recebido novamente sem divergência material.

### updated

Mesmo item recebido novamente com alteração permitida em campo mutável.

### conflicted

Mesmo item recebido novamente com divergência em campo auditável ou materialmente inconsistente.

## Campos auditáveis

Na base atual, são tratados como auditáveis:

- `psp`
- `externalId`
- `originalAmount`
- `currency`
- `createdAt`
- `installmentCount`
- `documentHash`
- `documentType`

Divergência nesses campos não deve gerar update automático.

## Campos atualizáveis

Na base atual, são tratados como atualizáveis:

- `status`
- `netAmount`
- `fees`
- `updatedAt`
- `payerSnapshot.name`
- `payerSnapshot.email`

## Relação com overlap e reprocessamento

A sincronização incremental pode revisitar a mesma faixa temporal por segurança.

Esse reprocessamento é comportamento esperado.

A política de idempotência existe para garantir que isso não gere:

- duplicata física
- duplicata lógica
- sobrescrita destrutiva

## Regra importante

Repetição não é conflito por definição.

Conflito só existe quando o item já conhecido reaparece com divergência material em campo auditável.
