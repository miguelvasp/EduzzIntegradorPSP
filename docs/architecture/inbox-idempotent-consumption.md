# Inbox Idempotent Consumption

## Objetivo

Garantir que o mesmo evento interno não reaplique efeito de negócio para o mesmo consumidor lógico quando já tiver sido processado com sucesso.

## Princípio

Outbox resolve consistência da emissão.

Inbox resolve idempotência do consumo.

Essas duas coisas não são a mesma coisa.

## Unidade de unicidade

A chave mínima de consumo idempotente é:

- `messageId`
- `consumerName`

Isso permite que o mesmo evento seja consumido por consumidores diferentes sem colisão indevida.

## Estrutura mínima da Inbox

O registro de consumo mantém:

- `messageId`
- `eventType`
- `consumerName`
- `aggregateType`
- `aggregateId`
- `status`
- `receivedAt`
- `processedAt`
- `correlationId`
- `lastError`

## Estados mínimos

- `received`
- `processing`
- `processed`
- `failed`
- `ignored_duplicate`

## Regras

### Evento novo

- cria registro na inbox
- marca processing
- executa handler
- marca processed se tudo der certo

### Evento já processado

- não reaplica efeito
- trata como duplicidade esperada
- retorna `ignored_duplicate`

### Evento com falha anterior

- permite nova tentativa
- mantém rastreabilidade

## Segurança

A Inbox não deve armazenar:

- documento em texto puro
- segredos
- payload sensível sem necessidade

## Benefício

Com essa base:

- retry do dispatcher não duplica efeito
- replay futuro fica viável
- troubleshooting do consumo fica rastreável
- consumidores internos ganham proteção contra reprocessamento indevido
