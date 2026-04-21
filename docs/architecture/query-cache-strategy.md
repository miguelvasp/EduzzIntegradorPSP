# Query Cache Strategy

## Objetivo

Aplicar cache como otimização controlada da leitura nos endpoints de consulta da API.

O cache não é fonte primária de verdade.

## Escopo inicial

A estratégia foi preparada para estes tipos de consulta:

- listagem de transações
- detalhe de transação
- listagem de parcelas da transação
- detalhe de parcela
- pagador da transação

## Componentes

### CacheService

Contrato principal de leitura e escrita em cache.

### InMemoryCacheService

Implementação simples para ambiente local e teste.

### CacheKeyBuilder

Responsável por compor chaves determinísticas por tipo de endpoint.

### CachePolicyResolver

Responsável por resolver habilitação global e TTL por tipo de consulta.

### CachedQueryExecutor

Responsável por executar:

- hit
- miss
- bypass
- fallback seguro quando houver erro de cache

## Política de chave

As chaves são compostas de forma:

- determinística
- estável
- específica por endpoint lógico
- baseada apenas em parâmetros funcionais relevantes

## Política de TTL

A v1 mantém TTL configurável por tipo de consulta.

Exemplo de intenção operacional:

- listagens: TTL curto
- detalhes: TTL moderado
- parcelas e pagador: TTL curto a moderado

## Regras de segurança

A estratégia de cache não deve:

- armazenar payload bruto de PSP
- expor documento em texto puro
- depender de segredo operacional
- alterar o contrato da resposta

## Regras de resiliência

Erro de cache não pode derrubar a consulta principal.

Se o cache falhar:

- a aplicação consulta a fonte primária
- retorna a resposta normalmente
- registra observabilidade do problema

## Observabilidade

A estratégia prevê logs para:

- `cache_hit`
- `cache_miss`
- `cache_bypass`
- `cache_read_error`
- `cache_write_error`

## Evolução futura

Essa base foi preparada para futura:

- invalidação por atualização de transação
- métrica específica de hit/miss
- troca do provedor por Redis ou similar
