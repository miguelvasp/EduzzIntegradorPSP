# Ingestion Business Validation

## Objetivo

Garantir que apenas itens compatíveis com o produto sejam aceitos na ingestão.

A validação ocorre sobre o modelo canônico, depois da adaptação do PSP e antes da consolidação final.

## Resultado possível

A validação atualmente produz:

- `valid`
- `rejected_by_business_rule`

## Estrutura

### IngestionValidationPipeline

Coordena a execução dos validadores de negócio.

### ValidationFailureClassifier

Normaliza as falhas em formato estruturado.

### Validadores

Cada regra crítica fica em um validador específico.

## Regras mínimas obrigatórias

### PaymentMethodScopeValidator

Aceita apenas transações com `paymentMethod = credit_card`.

### PayerPresenceValidator

Exige presença de `payerSnapshot`.

### PayerDocumentValidator

Exige documento tratável, representado por:

- `documentHash`
- `documentType`

### InstallmentCompletenessValidator

Exige:

- `installmentCount > 0`
- quantidade de parcelas coerente com `installmentCount`

### ExternalIdPresenceValidator

Exige `externalReference.externalId` utilizável.

### AmountConsistencyValidator

Exige coerência mínima dos valores:

- `originalAmount >= netAmount`
- valores monetários não negativos

## Regra importante

Validação de negócio não é erro técnico.

Também não é conflito por definição.

Ela representa falha de regra mínima para aceitação do item no produto.

## Integração com o fluxo

A ordem esperada do fluxo é:

1. item recebido do PSP
2. adaptação para modelo canônico
3. validação de negócio
4. idempotência
5. persistência ou rejeição rastreável

## Benefício

Com essa base, a aplicação evita consolidar:

- itens fora do escopo de cartão
- itens sem pagador
- itens sem documento tratável
- itens sem parcelas completas
- itens sem externalId
- itens com valores incoerentes
