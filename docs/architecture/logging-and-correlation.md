# Logging and Correlation

## Objetivo

Este documento define o padrão de logging estruturado e correlação da aplicação.

A solução deve permitir rastrear ponta a ponta:

- requisições HTTP;
- execuções de sincronização;
- chamadas a PSPs;
- processamento de itens;
- rejeições, conflitos e reconciliação;
- erros técnicos e erros de processamento.

A US-010 exige logging estruturado, requestId, correlationId e contexto correlacionável entre módulos e fluxos internos. :contentReference[oaicite:0]{index=0}

## Princípios

A estratégia de logging segue estes princípios:

- logs estruturados por padrão;
- metadados estáveis;
- correlação ponta a ponta;
- contexto mínimo obrigatório;
- ausência de dado sensível indevido;
- consistência entre módulos;
- legibilidade para troubleshooting;
- compatibilidade com auditoria e evolução futura para métricas.

## Identificadores de correlação

### requestId

Identificador único de cada requisição HTTP.

Responsabilidades:

- correlacionar entrada, saída e falha da requisição;
- acompanhar toda a execução do request;
- permitir troubleshooting de chamadas individuais.

### correlationId

Identificador lógico para correlação entre múltiplas etapas internas.

Responsabilidades:

- ligar operações relacionadas à mesma causa operacional;
- permitir rastreamento entre requisição, sync, item e eventos internos;
- sobreviver além de uma chamada isolada quando necessário.

### syncRunId

Identificador da execução de sincronização.

Responsabilidades:

- correlacionar logs da execução;
- permitir rastreamento por PSP, página, item e resultado;
- vincular observabilidade aos registros persistidos de `sync_runs`.

## Metadados mínimos do log

Os logs estruturados devem suportar, quando aplicável:

- timestamp
- level
- service
- environment
- module
- component
- eventType
- requestId
- correlationId
- syncRunId
- psp
- externalId
- transactionId
- installmentId
- reconciliationCaseId
- status
- errorCode
- durationMs
- context

## Categorias mínimas

A aplicação deve ser capaz de emitir logs categorizados, no mínimo, com:

- startup
- shutdown
- http_request
- http_response
- sync_started
- sync_progress
- sync_finished
- sync_failed
- psp_request
- psp_response
- transaction_processed
- transaction_rejected
- conflict_detected
- reconciliation_case_opened
- integration_error
- processing_error
- security_event

## Componentes centrais

### Logger

Componente central para emissão de logs estruturados em JSON.

Responsabilidades:

- padronizar o formato do log;
- aplicar contexto atual;
- aplicar nível;
- emitir log consistente entre módulos.

### RequestContext

Componente de contexto assíncrono.

Responsabilidades:

- transportar requestId;
- transportar correlationId;
- transportar syncRunId e demais chaves relevantes;
- permitir que múltiplos pontos do fluxo emitam logs correlacionados.

### LogContextFactory

Componente para construir contexto consistente por tipo de operação.

Responsabilidades:

- padronizar contexto HTTP;
- padronizar contexto de sync;
- padronizar contexto de PSP;
- padronizar contexto de transações;
- padronizar contexto de reconciliação.

### HttpLoggingMiddleware

Middleware para instrumentação HTTP.

Responsabilidades:

- gerar requestId quando ausente;
- reaproveitar x-request-id quando presente;
- gerar correlationId quando ausente;
- registrar log de entrada;
- registrar log de saída;
- registrar log de erro com duração.

## Contextos de aplicação

### HTTP

Logs mínimos:

- request started
- request completed
- request failed
- duração

### Sincronização

Logs mínimos:

- início da execução
- avanço por PSP
- avanço por página/lote
- item processado
- falha isolada de item
- resumo final

### Integração PSP

Logs mínimos:

- request para PSP
- response do PSP
- timeout
- contrato inválido
- erro técnico
- retry/backoff, quando existir

### Reconciliação

Logs mínimos:

- conflito detectado
- caso aberto
- ação aplicada
- caso resolvido ou encerrado

## Relação com rastreabilidade persistida

Logs estruturados complementam, e não substituem:

- `sync_runs`
- `sync_items`
- `transaction_events`
- `integration_errors`
- `processing_errors`
- `reconciliation_cases`

Sempre que aplicável, logs devem poder ser correlacionados com esses registros.

## Regras de segurança

Logs não devem expor:

- documento do pagador em texto puro;
- tokens;
- api keys;
- passwords;
- connection strings completas;
- payload bruto não sanitizado;
- mensagens técnicas com conteúdo sensível indevido.

A política de redaction e sanitização definida anteriormente deve ser aplicada ao logging.

## Resultado esperado

Com esse padrão implantado, a aplicação fica preparada para:

- troubleshooting rápido;
- correlação ponta a ponta;
- suporte técnico;
- auditoria técnica;
- futura extração de métricas de operação.
