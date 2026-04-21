# Transactional Outbox

## Objetivo

Garantir consistência entre a mutação do estado principal e o registro do evento que será processado depois.

A regra é simples:

- ou estado e outbox são persistidos juntos
- ou nenhum dos dois é confirmado

## Problema que resolve

Sem outbox, o sistema pode:

- atualizar o banco e falhar ao emitir o evento
- emitir o evento e falhar ao persistir o estado

Os dois cenários são ruins.

## Componentes

### OutboxMessage

Representa a mensagem persistida na outbox.

Campos mínimos:

- `id`
- `eventType`
- `aggregateType`
- `aggregateId`
- `payload`
- `status`
- `createdAt`
- `correlationId`
- `syncRunId`
- `retryCount`

### OutboxRepository

Porta de persistência da mensagem.

### UnitOfWork

Boundary transacional da operação.

### OutboxMessageFactory

Responsável por criar payload mínimo, estável e seguro.

### TransactionalOutboxService

Responsável por coordenar a persistência do estado e da mensagem no mesmo boundary transacional.

## Quando gerar outbox

Na v1, faz sentido para eventos como:

- `transaction.ingested`
- `transaction.updated`
- `transaction.rejected`
- `transaction.conflict_detected`
- `reconciliation.case_opened`
- `sync.finished`
- `sync.failed`

## Quando não gerar

Não gerar por padrão para:

- leitura da API
- `no_change`
- repetição idempotente sem alteração material
- log técnico sem valor de processamento assíncrono

## Segurança

O payload do outbox não deve carregar:

- documento em texto puro
- hash sensível
- payload bruto do PSP
- segredos

## Evolução futura

Essa base prepara o sistema para:

- dispatcher de outbox
- retry
- dead-letter
- consumo idempotente
- invalidação por evento
