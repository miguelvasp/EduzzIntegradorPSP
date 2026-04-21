# Transaction Detail Endpoint

## Objetivo

Disponibilizar a consulta detalhada de uma transação consolidada por meio do endpoint:

- `GET /transactions/:id`

## Entrada

O endpoint recebe o identificador interno da transação no path.

Regra:

- `id` deve ser inteiro positivo
- `id` inválido deve resultar em `400`
- transação inexistente deve resultar em `404`

## Estrutura da resposta

A resposta contém:

- bloco principal da transação
- bloco seguro do pagador
- resumo das parcelas associadas

## Bloco principal

Campos mínimos da transação:

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

## Bloco do pagador

A resposta expõe apenas dados seguros:

- `id`
- `externalId`
- `name`
- `email`
- `documentType`
- `hasDocument`

## Segurança

A resposta não deve expor:

- documento do pagador em texto puro
- hash do documento
- payload bruto do PSP
- dados internos de reconciliação
- segredos operacionais

## Bloco de parcelas

O endpoint retorna resumo das parcelas:

- `id`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `paidAt`
- `updatedAt`

## Estrutura da implementação

### GetTransactionByIdUseCase

Valida o identificador, consulta o repositório e retorna o detalhe consolidado.

### TransactionQueryRepository

Responsável por ler o detalhe da transação a partir do estado consolidado.

### TransactionDetailHttpMapper

Serializa a resposta final segura do endpoint.

### GetTransactionByIdController

Recebe a requisição HTTP e devolve a resposta detalhada.

## Regra importante

O detalhe deve refletir o estado consolidado da base, não o payload bruto recebido do PSP.
