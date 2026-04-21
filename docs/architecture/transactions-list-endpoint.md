# Transactions List Endpoint

## Objetivo

Disponibilizar a consulta paginada das transações consolidadas por meio do endpoint:

- `GET /transactions`

## Filtros suportados

A v1 suporta os filtros opcionais:

- `startDate`
- `endDate`
- `status`
- `psp`
- `payerDocument`
- `page`
- `limit`

## Regras de paginação

- `page` padrão = `1`
- `limit` padrão = `20`
- `limit` máximo = `100`

## Estrutura da resposta

A resposta paginada contém:

- `items`
- `total`
- `page`
- `limit`
- `totalPages`

## Campos do item

A listagem expõe visão resumida e segura da transação:

- `id`
- `externalId`
- `psp`
- `status`
- `originalAmount`
- `netAmount`
- `fees`
- `installmentCount`
- `currency`
- `createdAt`
- `updatedAt`

## Segurança

A resposta não deve expor:

- documento do pagador em texto puro
- payload bruto do PSP
- dados internos de reconciliação
- segredos operacionais

## Estrutura da implementação

### ListTransactionsUseCase

Normaliza e valida a query de entrada, chama o repositório e monta a resposta paginada.

### TransactionQueryRepository

Responsável pela leitura paginada no estado consolidado.

### TransactionListHttpMapper

Responsável por devolver apenas os campos seguros da resposta.

### ListTransactionsController

Responsável por receber a requisição HTTP e devolver o payload paginado.

## Regra importante

O controller não deve acessar banco diretamente.

A consulta deve operar sobre o estado consolidado da transação, não sobre payload bruto de PSP.
