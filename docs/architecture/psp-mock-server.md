# PSP Mock Server

## Objetivo

Disponibilizar um mock server local e determinístico para desenvolvimento e testes das integrações com PSPs, sem dependência de sandbox externo.

## Escopo inicial

A base atual cobre os endpoints mínimos exigidos para os adapters já implementados.

### Pagar.me

- `GET /core/v5/orders`
- `GET /core/v5/orders/:id`

### Mercado Pago

- `GET /v1/payments/search`
- `GET /v1/payments/:id`

## Estrutura

### Datasets

Os dados ficam versionados em JSON local:

- `src/mock-server/datasets/pagarme/orders.json`
- `src/mock-server/datasets/mercado-pago/payments.json`

### App

As rotas são registradas em módulos separados por PSP.

### Utilitários

A paginação e a carga de datasets ficam desacopladas das rotas.

## Regras

- mesmo dataset + mesmos parâmetros = mesma resposta
- detalhe precisa ser coerente com a listagem
- foco em contrato mínimo consumido pela aplicação
- sem simular toda a API real do PSP

## Paginação suportada

### Pagar.me

- `page`
- `size`

Resposta:

- `data`
- `paging.total`
- `paging.has_more`

### Mercado Pago

- `offset`
- `limit`
- `payment_type_id`

Resposta:

- `results`
- `paging.total`
- `paging.limit`
- `paging.offset`

## Uso local

O mock server sobe por entrypoint próprio em:

- `src/mock-server/index.ts`

Porta padrão:

- `3334`

## Próxima evolução

A base fica pronta para:

- cenários inválidos
- falhas técnicas simuladas
- datasets alternativos
- integração futura com Docker Compose
