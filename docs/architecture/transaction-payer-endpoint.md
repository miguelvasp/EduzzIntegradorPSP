# Transaction Payer Endpoint

## Objetivo

Disponibilizar a consulta segura do pagador associado a uma transação consolidada por meio do endpoint:

- `GET /transactions/:transactionId/payers`

## Entrada

O endpoint recebe o identificador interno da transação no path.

Regra:

- `transactionId` deve ser inteiro positivo
- valor inválido deve resultar em `400`
- transação inexistente ou sem pagador associado deve resultar em `404`

## Estrutura da resposta

A resposta contém apenas dados seguros do pagador:

- `id`
- `externalId`
- `name`
- `email`
- `documentType`
- `hasDocument`

## Regra de segurança

A resposta não deve expor:

- documento em texto puro
- hash do documento
- payload bruto do PSP
- segredos operacionais

## Estrutura da implementação

### GetTransactionPayerUseCase

Valida o identificador, consulta o repositório e trata não encontrado.

### TransactionQueryRepository

Responsável por ler o pagador associado à transação no estado consolidado.

### TransactionPayerHttpMapper

Serializa a resposta final segura do endpoint.

### GetTransactionPayerController

Recebe a requisição HTTP e devolve a resposta do pagador.

## Regra importante

O endpoint deve refletir o estado consolidado do pagador associado à transação, respeitando a política de segurança do sistema.
