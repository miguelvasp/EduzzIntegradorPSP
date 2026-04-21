# Outbox Dispatcher

## Objetivo

Drenar mensagens persistidas no outbox com segurança operacional, retry controlado e terminalização adequada.

## Ciclo de vida mínimo da mensagem

A mensagem pode assumir:

- `pending`
- `processing`
- `processed`
- `retry_scheduled`
- `dead_lettered`
- `failed_terminal`

## Componentes

### OutboxRetryPolicy

Decide:

- se a falha é retentável
- se ainda vale tentar de novo
- quando será a próxima tentativa

### DeadLetterService

Encaminha mensagens irrecuperáveis para estado terminal de dead-letter.

### OutboxMessageProcessor

Processa uma mensagem individual.

Resultados possíveis:

- `processed_successfully`
- `retry_scheduled`
- `dead_lettered`
- `failed_terminal`

### OutboxDispatcher

Busca mensagens elegíveis, marca `processing`, processa uma a uma e isola falhas por mensagem.

## Princípios

- falha de uma mensagem não derruba o lote inteiro
- retry só quando existe chance razoável de recuperação
- excesso de tentativa não pode virar loop infinito
- falha terminal precisa ser rastreável

## Regras mínimas da v1

### Erro retentável

Exemplos:

- timeout
- erro de rede
- indisponibilidade temporária

Resultado:

- `retry_scheduled`, se ainda houver tentativas disponíveis

### Erro terminal

Exemplos:

- payload inválido
- contrato impossível de processar
- tipo de evento sem tratamento

Resultado:

- `failed_terminal`

### Excesso de tentativas

Quando o erro continua retentável mas o limite foi atingido.

Resultado:

- `dead_lettered`

## Segurança

O dispatcher não deve:

- logar documento em texto puro
- logar payload sensível integral
- expor segredos

## Evolução futura

Essa base prepara o sistema para:

- replay manual
- métricas operacionais do dispatcher
- inbox idempotente
- consumo distribuído mais robusto
