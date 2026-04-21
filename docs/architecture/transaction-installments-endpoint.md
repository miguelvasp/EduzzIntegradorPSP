# Transaction Installments Endpoint

## Objetivo

Disponibilizar a consulta das parcelas associadas a uma transação consolidada por meio do endpoint:

- `GET /transactions/:id/installments`

## Entrada

O endpoint recebe o identificador interno da transação no path.

Regra:

- `id` deve ser inteiro positivo
- `id` inválido deve resultar em `400`
- transação inexistente deve resultar em `404`

## Estrutura da resposta

A resposta contém a coleção das parcelas associadas à transação.

Cada item expõe:

- `id`
- `transactionId`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `dueAt`
- `paidAt`
- `updatedAt`

## Ordenação

A listagem deve ser retornada em ordem crescente de `installmentNumber`.

Essa ordenação é obrigatória no contrato da v1.

## Segurança

O endpoint não expõe:

- payload bruto do PSP
- dados internos de reconciliação
- segredos operacionais

## Estrutura da implementação

### ListTransactionInstallmentsUseCase

Valida o identificador, consulta o repositório, trata não encontrado e garante ordenação por parcela.

### InstallmentQueryRepository

Responsável por ler as parcelas da transação no estado consolidado.

### TransactionInstallmentHttpMapper

Serializa a resposta final do endpoint.

### ListTransactionInstallmentsController

Recebe a requisição HTTP e devolve a coleção de parcelas.

## Regra importante

O endpoint deve refletir o estado consolidado do parcelamento persistido pela aplicação, não o payload bruto vindo do PSP.
