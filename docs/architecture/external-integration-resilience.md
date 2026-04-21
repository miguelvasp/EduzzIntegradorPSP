# External Integration Resilience

## Objetivo

Padronizar a resiliência das chamadas aos PSPs para reduzir falhas transitórias, evitar sobrecarga desnecessária e manter previsibilidade operacional.

## O que foi implementado

### Timeout

Toda chamada externa deve ter timeout explícito.

Objetivo:

- evitar espera indefinida
- encerrar operação degradada de forma controlada

### Retry

Retry é permitido apenas para falhas transitórias.

Exemplos de falhas retentáveis:

- timeout
- erro de rede temporário
- status `408`
- status `429`
- status `5xx`

Exemplos de falhas não retentáveis:

- status `400`
- status `401`
- status `403`
- status `404`
- erro de contrato inválido
- credencial inválida

### Backoff exponencial com jitter

Quando houver retry, o intervalo entre tentativas cresce progressivamente.

Objetivo:

- reduzir pressão sobre PSP degradado
- evitar rajada de novas tentativas ao mesmo tempo

### Circuit Breaker

O circuit breaker protege a aplicação quando a integração entra em falha persistente.

Estados:

- `closed`: operação normal
- `open`: novas tentativas bloqueadas temporariamente
- `half_open`: teste controlado de recuperação

### Rate limiting

Quando a resposta indicar limitação por taxa, a aplicação deve reconhecer o cenário e respeitar `Retry-After` quando disponível.

## Componentes

### RetryPolicy

Responsável por:

- decidir se erro é retentável
- calcular delay entre tentativas
- executar retry controlado

### CircuitBreaker

Responsável por:

- abrir circuito após sequência de falhas
- bloquear novas execuções durante janela de proteção
- permitir retomada controlada

### RateLimitHandler

Responsável por:

- identificar status `429`
- interpretar header `Retry-After`

### ResiliencePolicy

Responsável por orquestrar:

- timeout
- retry
- circuit breaker
- tratamento de rate limit

## Regras de uso

- cliente de PSP não deve implementar retry manual por fora
- cliente de PSP deve usar a `ResiliencePolicy`
- erro externo deve virar erro classificado de integração
- logs devem registrar tentativas, falhas e abertura de circuito
- payload sensível e segredos não devem ir para log

## Resultado esperado

Com essa base:

- falhas transitórias não derrubam integração de forma burra
- falhas permanentes não geram retry inútil
- degradação persistente não gera tempestade de chamadas
- a integração fica pronta para ser usada pelos clientes do Pagar.me e Mercado Pago
