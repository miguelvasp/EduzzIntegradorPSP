# Pagar.me Integration

## Objetivo

Integrar o Pagar.me de forma desacoplada do domínio interno, com foco em:

- consumo paginado de pedidos
- consulta de detalhe por pedido
- filtro de escopo para cartão de crédito
- adaptação para o modelo canônico da aplicação
- proteção de dados sensíveis
- uso da política de resiliência já implementada

## Componentes

### PagarmeHttpClient

Responsável por:

- chamar `GET /core/v5/orders?page=x&size=y`
- chamar `GET /core/v5/orders/:id`
- aplicar autenticação
- aplicar timeout, retry e circuit breaker
- validar contrato mínimo de resposta
- registrar logs estruturados
- lançar erro classificado de integração

### PagarmeTransactionAdapter

Responsável por:

- validar dados mínimos do pedido
- identificar charge elegível de cartão de crédito
- mapear status do Pagar.me para status canônico
- adaptar pedido para transação canônica
- adaptar customer para payer com hash do documento
- compor parcelas mínimas a partir da quantidade de parcelas disponível

### pagarme.schemas.ts

Responsável por:

- definir o contrato mínimo esperado do payload do Pagar.me
- evitar acoplamento direto do restante da aplicação ao JSON bruto

### pagarme.mappers.ts

Responsável por:

- concentrar regras pequenas de mapeamento
- mapear status
- mapear tipo de documento
- validar dados mínimos
- filtrar charge elegível
- normalizar datas e valores

## Endpoints usados

- `GET /core/v5/orders?page=1&size=20`
- `GET /core/v5/orders/:id`

## Regra de escopo

Somente pedidos com operação de cartão de crédito são elegíveis.

Critério usado:

- `charges[].payment_method = credit_card`
- `charges[].last_transaction.transaction_type = credit_card`

Itens fora desse escopo não devem seguir para ingestão.

## Mapeamento canônico

### Transaction

Campos principais adaptados:

- `externalId` a partir de `order.id`
- `psp = pagarme`
- `status` mapeado para valor canônico
- `originalAmount` a partir de `order.amount`
- `netAmount` a partir de `charge.paid_amount`
- `fees` pela diferença entre bruto e líquido
- `installmentCount` a partir de `last_transaction.installments`
- `currency`
- `createdAt`
- `updatedAt`

### Payer

Campos principais adaptados:

- `externalId` a partir de `customer.id`
- `name`
- `email`
- `documentHash`
- `documentType`

O documento não deve ser mantido nem exposto em texto puro.

### Installments

Como o contrato simplificado do desafio não traz parcelas individuais completas, a integração compõe parcelas mínimas coerentes com:

- quantidade de parcelas
- valor total da transação
- taxa total da transação

A distribuição é proporcional, com ajuste de arredondamento.

## Status

Os status do Pagar.me não são reutilizados diretamente no domínio.

Eles são convertidos para o catálogo canônico da aplicação.

Exemplos:

- `paid` / `captured` -> `paid`
- `pending` / `processing` -> `pending`
- `canceled` -> `canceled`
- `failed` -> `failed`
- status não reconhecido -> `unknown`

## Segurança

A integração deve respeitar estas regras:

- não expor documento em texto puro
- usar hash para documento do pagador
- sanitizar payloads em logs de erro
- não vazar segredo, api key ou resposta bruta sensível
- classificar falhas técnicas como erro de integração

## Resiliência

O cliente do Pagar.me usa a política central de resiliência da aplicação:

- timeout
- retry para falhas transitórias
- backoff exponencial com jitter
- circuit breaker
- tratamento de rate limiting

Retry não deve ser usado de forma burra para erro permanente de contrato ou autenticação inválida.

## Resultado esperado

Com essa base, a sincronização futura poderá:

- buscar páginas no Pagar.me
- consultar detalhe de pedidos específicos
- receber dados já adaptados para o modelo canônico
- manter separação entre contrato externo e domínio interno
