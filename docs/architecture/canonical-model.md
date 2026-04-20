# Canonical Model

## Visao canonica interna

O modelo canonico interno transforma diferentes contratos de PSP em uma unica estrutura semantica orientada ao dominio de transacoes. Ele existe para isolar a aplicacao de nomes, formatos e organizacoes especificas de cada integracao externa.

## Status canonicos de transacao

O projeto adota os seguintes status canonicos minimos de transacao:

- `pending`
- `paid`
- `canceled`
- `refunded`
- `failed`
- `disputed`
- `partially_refunded`
- `unknown`

Esses status representam o estado interno observado pela aplicacao, independentemente do nome ou granularidade usados por cada PSP.

## Status canonicos de parcela

O projeto adota os seguintes status canonicos minimos de parcela:

- `pending`
- `scheduled`
- `paid`
- `canceled`
- `failed`
- `unknown`

Esse conjunto permite distinguir pendencia operacional, agendamento futuro, liquidacao observada, cancelamento, falha e casos sem mapeamento conclusivo.

## Idempotencia semantica

A identidade externa canonica de uma transacao e formada por `psp + externalId`, encapsulada em `externalReference`.

Essa composicao:

- evita ambiguidade entre provedores diferentes
- permite reprocessamento futuro sem duplicacao semantica
- separa a identidade interna da identidade observada no provedor

O value object `ExternalTransactionReferenceValueObject` formaliza essa regra e evita `externalId` solto sem PSP associado.

## Protecao de documento do pagador

O dominio nao trata documento em texto puro. A transacao carrega um `payerSnapshot` canonico com `documentHash` e `documentType`.

O value object `DocumentHashValueObject` existe para impedir que o modelo canonico aceite documento formatado ou puramente numerico como se fosse hash.

## Separacao entre contrato externo e modelo interno

O dominio canonico nao replica campos ou estruturas especificas de PSP. Adaptadores externos futuros devem traduzir payloads brutos para:

- `Transaction`
- `Installment`
- `PayerSnapshot`
- value objects canonicos

Isso preserva independencia de integracao, reduz acoplamento e facilita evolucao do modelo interno sem contaminar o dominio com detalhes dos provedores.

## Dados auditaveis e dados atualizaveis

O modelo distingue dados que devem permanecer historicamente estaveis de dados que podem evoluir com novas sincronizacoes.

Auditaveis:

- `externalReference`
- `createdAt`
- valores financeiros base
- `installmentCount`
- `currency`
- `payerSnapshot`

Atualizaveis:

- `status`
- `updatedAt`
- status e datas operacionais das parcelas
- metadados complementares seguros

## Evolucao futura habilitada por essa base

Esse modelo canonico prepara o sistema para:

- persistencia relacional futura sem depender de payload externo
- sincronizacao incremental futura com validacao minima do dominio
- consulta futura por API em cima de uma representacao interna consistente
- reconciliacao futura sobre status, valores e parcelas a partir de um vocabulario unico
