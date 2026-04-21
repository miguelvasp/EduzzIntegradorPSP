# Mercado Pago Integration

## Objetivo

Integrar o Mercado Pago de forma desacoplada do domínio interno, com foco em:

- busca paginada de pagamentos
- consulta de detalhe por pagamento
- filtro explícito de escopo para cartão de crédito
- adaptação para o modelo canônico da aplicação
- proteção de dados sensíveis
- uso da política de resiliência já implementada

## Componentes

### MercadoPagoHttpClient

Responsável por:

- chamar `GET /v1/payments/search?payment_type_id=credit_card&offset=x&limit=y`
- chamar `GET /v1/payments/:id`
- aplicar autenticação bearer token
- aplicar timeout, retry e circuit breaker
- validar contrato mínimo de resposta
- registrar logs estruturados
- lançar erro classificado de integração

### MercadoPagoTransactionAdapter

Responsável por:

- validar dados mínimos do pagamento
- validar escopo de cartão de crédito
- mapear status do Mercado Pago para status canônico
- adaptar pagamento para transação canônica
- adaptar payer para payer com hash do documento
- compor parcelas mínimas a partir da quantidade de parcelas disponível
- calcular fees a partir de `fee_details`

### mercadopago.schemas.ts

Responsável por:

- definir o contrato mínimo esperado do payload do Mercado Pago
- evitar acoplamento direto do restante da aplicação ao JSON bruto

### mercadopago.mappers.ts

Responsável por:

- concentrar regras pequenas de mapeamento
- mapear status
- mapear tipo de documento
- validar escopo de cartão
- validar dados mínimos
- validar payer
- validar installments
- converter decimal para centavos
- somar fees
- normalizar datas

## Endpoints usados

- `GET /v1/payments/search?payment_type_id=credit_card&offset=0&limit=20`
- `GET /v1/payments/:id`

## Regra de escopo

Somente pagamentos com `payment_type_id = credit_card` são elegíveis.

Itens fora desse escopo não devem seguir para ingestão.

## Mapeamento canônico

### Transaction

Campos principais adaptados:

- `externalId` a partir de `payment.id`
- `psp = mercadopago`
- `status` mapeado para valor canônico
- `originalAmount` a partir de `transaction_amount`
- `netAmount` a partir de `net_received_amount`
- `fees` a partir da soma de `fee_details`
- `installmentCount` a partir de `installments`
- `currency` a partir de `currency_id`
- `createdAt` a partir de `date_created`
- `updatedAt` a partir de `date_last_updated`

### Payer

Campos principais adaptados:

- `externalId` a partir de `payer.id`
- `name` pela composição de `first_name` e `last_name`
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

Os status do Mercado Pago não são reutilizados diretamente no domínio.

Exemplos:

- `approved` / `accredited` -> `paid`
- `pending` -> `pending`
- `rejected` -> `failed`
- `cancelled` -> `canceled`
- status não reconhecido -> `unknown`

## Conversão monetária

O Mercado Pago retorna valores em decimal.

A integração converte esses valores para centavos usando conversão determinística com `Math.round(value * 100)`.

Isso é aplicado em:

- `transaction_amount`
- `net_received_amount`
- `fee_details[].amount`

## Segurança

A integração deve respeitar estas regras:

- não expor documento em texto puro
- usar hash para documento do pagador
- sanitizar payloads em logs de erro
- não vazar token nem resposta bruta sensível
- classificar falhas técnicas como erro de integração

## Resiliência

O cliente do Mercado Pago usa a política central de resiliência da aplicação:

- timeout
- retry para falhas transitórias
- backoff exponencial com jitter
- circuit breaker
- tratamento de rate limiting

## Resultado esperado

Com essa base, a sincronização futura poderá:

- buscar páginas no Mercado Pago
- consultar detalhe de pagamentos específicos
- receber dados já adaptados para o modelo canônico
- manter separação entre contrato externo e domínio interno
