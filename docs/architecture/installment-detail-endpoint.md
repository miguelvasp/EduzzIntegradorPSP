# Installment Detail Endpoint

## Objetivo

Disponibilizar a consulta detalhada de uma parcela consolidada por meio do endpoint:

- `GET /transactions/:transactionId/installments/:installmentId`

## Entrada

O endpoint recebe dois identificadores no path:

- `transactionId`
- `installmentId`

Regras:

- ambos devem ser inteiros positivos
- valores inválidos devem resultar em `400`
- transação inexistente deve resultar em `404`
- parcela inexistente ou não pertencente à transação deve resultar em `404`

## Estrutura da resposta

A resposta contém os dados consolidados da parcela:

- `id`
- `transactionId`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `dueAt`
- `paidAt`
- `updatedAt`

## Regra de vínculo

A parcela retornada deve pertencer à transação informada.

Não basta a parcela existir isoladamente.

## Segurança

O endpoint não expõe:

- payload bruto do PSP
- dados internos de reconciliação
- segredos operacionais

## Estrutura da implementação

### GetInstallmentByIdUseCase

Valida os identificadores, consulta o repositório e trata não encontrado.

### InstallmentQueryRepository

Responsável por ler a parcela no estado consolidado e respeitando o vínculo com a transação.

### InstallmentDetailHttpMapper

Serializa a resposta final do endpoint.

### GetInstallmentByIdController

Recebe a requisição HTTP e devolve a resposta detalhada da parcela.

## Regra importante

O endpoint deve responder com base no estado consolidado persistido pela aplicação, não em payload bruto vindo do PSP.
