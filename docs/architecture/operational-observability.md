# Operational Observability

## Objetivo

Este documento consolida a estratégia mínima de observabilidade operacional da aplicação sem reabrir os fluxos já estabilizados.

A abordagem adiciona instrumentação por fora dos fluxos principais, preservando o comportamento já validado em sincronização, persistência e API.

## Escopo

A observabilidade operacional cobre quatro blocos:

- observabilidade HTTP global;
- observabilidade de dependência externa;
- observabilidade de falha de banco;
- resumo operacional da sincronização.

## 1. Observabilidade HTTP global

### Responsabilidades

A camada HTTP deve:

- gerar ou reaproveitar `requestId`;
- devolver `x-request-id` na resposta;
- registrar início da requisição;
- registrar fim da requisição;
- registrar erro HTTP global;
- registrar latência da requisição.

### Eventos

#### `http_request_started`

Emitido no início da requisição.

Campos mínimos:

- `requestId`
- `method`
- `url`
- `ip`

#### `http_request_completed`

Emitido no fim da requisição.

Campos mínimos:

- `requestId`
- `method`
- `url`
- `statusCode`
- `durationMs`

#### `http_request_failed`

Emitido no tratamento global de erro HTTP.

Campos mínimos:

- `requestId`
- `method`
- `url`
- `statusCode`
- `durationMs`
- `error.name`
- `error.message`

## 2. Logger de dependência externa

### Objetivo

Padronizar logs de integração externa sem espalhar regras de classificação por todo o código dos clients.

### Dependências cobertas

- Pagar.me
- Mercado Pago

### Eventos

#### `external_dependency_success`

Usado quando a chamada externa termina com sucesso.

Campos mínimos:

- `provider`
- `operation`
- `endpoint`
- `durationMs`

#### `external_dependency_retry`

Usado quando uma tentativa falha mas a política de resiliência vai tentar novamente.

Campos mínimos:

- `provider`
- `operation`
- `endpoint`
- `attempt`
- `maxAttempts`
- `delayMs`

#### `external_dependency_rate_limited`

Usado quando o upstream sinaliza limitação de taxa.

Campos mínimos:

- `provider`
- `operation`
- `endpoint`
- `retryAfterMs`

#### `external_dependency_failure`

Usado quando a chamada externa falha de forma final.

Campos mínimos:

- `provider`
- `operation`
- `endpoint`
- `durationMs`
- `errorClass`
- `statusCode`
- `retryable`

### Classes mínimas de falha

O logger classifica as falhas em:

- `timeout`
- `upstream_4xx`
- `upstream_5xx`
- `unavailable`
- `failure`

## 3. Logger de falha de banco

### Objetivo

Padronizar o log de erro de persistência sem vazar SQL inteiro, statement completo ou detalhes sensíveis da infraestrutura.

### Repositórios cobertos

- `SqlServerSyncCheckpointRepository`
- `SqlServerIdempotencyRepository`
- `SqlServerTransactionPersistenceRepository`
- `SqlServerInstallmentPersistenceRepository`
- `SqlServerPayerPersistenceRepository`

### Evento

#### `database_operation_failed`

Campos mínimos:

- `repository`
- `operation`
- `entity`
- `errorName`
- `errorMessage`

### Regra

O logger registra contexto suficiente para troubleshooting, mas não deve expor:

- SQL completo;
- connection string;
- segredo;
- token;
- payload sensível bruto.

## 4. Resumo operacional da sincronização

### Objetivo

Emitir um resumo final legível da execução de sincronização, útil para operação e troubleshooting, sem depender de consulta manual em múltiplas tabelas.

### Eventos

#### `sync_operational_summary`

Resumo da execução full.

#### `incremental_sync_operational_summary`

Resumo da execução incremental.

### Campos mínimos

- `syncRunId`
- `correlationId`
- `targetPsps`
- `durationMs`
- `pagesProcessed`
- `itemsRead`
- `itemsProcessed`
- `itemsSucceeded`
- `itemsFailed`
- `rejectedCount`
- `conflictedCount`
- `integrationErrorCount`
- `processingErrorCount`

## Relação com o restante da solução

A observabilidade operacional complementa:

- logs estruturados já existentes;
- tratamento global de erro HTTP;
- resiliência dos clients PSP;
- rastreabilidade persistida em banco;
- troubleshooting de sincronização.

Ela não substitui:

- `sync_runs`
- `sync_items`
- `processing_errors`
- `integration_errors`
- `transaction_events`
- `transaction_integration_evidences`

## Estratégia adotada

A estratégia foi deliberadamente incremental:

- preservar fluxos que já estavam funcionando;
- adicionar instrumentação por camada;
- não reescrever core de sincronização;
- não espalhar `try/catch` arbitrário;
- concentrar logging em pontos de borda e falha.

## Resultado esperado

Com essa baseline operacional, deve ser possível responder rapidamente:

- qual request falhou;
- qual upstream falhou;
- se houve timeout, retry ou indisponibilidade;
- em qual repositório uma operação de banco falhou;
- qual foi o resumo final de uma execução de sync;
- quantos itens foram lidos, processados, rejeitados, conflitados ou falharam.
