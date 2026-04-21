# Cache Observability

## Objetivo

Dar visibilidade operacional à camada de cache da aplicação.

A observabilidade cobre:

- hit
- miss
- bypass
- set
- invalidate
- error

## Componentes

### CacheMetricsEvent

Representa o evento observável da operação de cache.

### CacheObservationContext

Representa o contexto correlacionável da operação.

### CacheOperationTimer

Mede duração da operação em milissegundos.

### CacheMetricsCollector

Registra contadores, produz snapshot e emite logs estruturados.

## Operações mínimas observáveis

- `hit`
- `miss`
- `bypass`
- `set`
- `invalidate`
- `error`

## Recursos mínimos observáveis

- `transactions_list`
- `transaction_detail`
- `transaction_installments`
- `installment_detail`
- `transaction_payer`

## Métricas mínimas

### Totais

- hits
- misses
- bypasses
- sets
- invalidations
- errors

### Por recurso

Os mesmos contadores são mantidos por tipo de recurso.

## Latência

Cada evento registra:

- `durationMs`

Isso permite análise futura de:

- custo de leitura
- custo de escrita
- custo de invalidação
- comparação entre hit e miss

## Correlação

Os eventos podem carregar:

- `requestId`
- `correlationId`
- `transactionId`
- `syncRunId`
- `cacheKey`
- `namespace`

## Segurança

A observabilidade do cache não deve expor:

- documento em texto puro
- hash sensível
- payload cacheado
- segredos do provedor

## Benefício

Com essa base, o time consegue responder:

- se o cache está tendo hit real
- onde há miss excessivo
- se a invalidação está agressiva demais
- onde existem erros operacionais na camada
