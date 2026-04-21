# Cache Invalidation Policy

## Objetivo

Garantir coerência entre o estado consolidado da base e as respostas servidas do cache dos endpoints de consulta.

## Princípio

Consistência funcional vale mais que retenção máxima de cache.

Na v1, se for necessário invalidar mais do que o ideal para manter segurança funcional, isso é aceitável.

## Evento de invalidação

A invalidação parte de um contexto explícito de mudança, com:

- `transactionId`
- `syncRunId`
- `changeType`
- `affectedInstallmentIds`
- `payerChanged`
- `materialChange`

## Tipos mínimos de mudança

- `transaction_updated`
- `installments_updated`
- `payer_updated`
- `no_change`

## Regras da política

### transaction_updated

Invalidar:

- detalhe da transação
- namespace da listagem de transações

### installments_updated

Invalidar:

- detalhe da transação
- listagem de parcelas da transação
- detalhe das parcelas afetadas

### payer_updated

Invalidar:

- pagador da transação
- detalhe da transação

### no_change

Não invalidar por padrão.

## Chaves e namespaces

### Chaves individuais

- `transactions:detail|transactionId={id}`
- `transactions:installments|transactionId={id}`
- `transactions:installment-detail|installmentId={id}|transactionId={transactionId}`
- `transactions:payer|transactionId={id}`

### Namespace

- `transactions:list`

## Momento da invalidação

A invalidação deve ocorrer apenas após confirmação segura da atualização material do estado principal.

## Falha de invalidação

Falha de invalidação não deve corromper a persistência principal.

Na v1:

- registra log estruturado
- não derruba a operação principal por padrão

## Evolução futura

Essa base foi preparada para futura:

- invalidação por evento/outbox
- métricas de invalidação
- invalidação mais fina por grupo de filtros
