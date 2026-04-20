# Conflict and Rejection Model

## Objetivo

Este documento descreve a modelagem de conflitos, rejeições e falhas de validação da ingestão de transações multi-PSP.

O objetivo dessas estruturas é impedir que ocorrências de negócio sejam tratadas como fluxo normal de consolidação, preservando rastreabilidade, auditabilidade e integridade do estado consolidado.

A US-008 exige distinção clara entre:

- falha de validação;
- rejeição de negócio;
- conflito de dados;
- caso de reconciliação.

Esses conceitos não devem ser misturados com erro técnico de integração nem com o estado consolidado da transação. :contentReference[oaicite:0]{index=0}

## Princípios adotados

A modelagem segue os princípios abaixo:

- separação conceitual entre rejeição, conflito e erro técnico;
- rastreabilidade ponta a ponta entre item processado, payload e transação;
- preservação de evidência sem update destrutivo;
- suporte a reconciliação futura;
- baixo acoplamento com o estado atual consolidado;
- compatibilidade com testes e troubleshooting.

## Visão geral dos conceitos

### Falha de validação

Falha de validação representa uma inconsistência estrutural ou semântica identificada durante a ingestão, antes da consolidação do item no estado atual.

Ela indica que o item não atende aos critérios mínimos do modelo de negócio.

Exemplos:

- ausência de pagador;
- ausência de parcelas;
- meio de pagamento fora do escopo;
- documento inválido;
- identificador externo ausente;
- dados obrigatórios incompletos.

### Rejeição de negócio

Rejeição representa a decisão formal de não consolidar um item.

Ela não é erro técnico e não deve ser confundida com simples falha de integração.

A rejeição é uma decisão operacional/de negócio baseada em regra aplicada ao item.

Exemplos:

- item rejeitado por ausência de pagador;
- item rejeitado por parcelas incompletas;
- item rejeitado por meio de pagamento fora do escopo;
- item rejeitado por dados obrigatórios inválidos.

### Conflito de dados

Conflito representa divergência material entre o item recebido e o estado consolidado existente, exigindo tratamento controlado.

Conflito não é rejeição automática e não deve ser tratado como update destrutivo.

Exemplos:

- divergência de valor bruto;
- divergência de valor líquido;
- divergência de taxas;
- divergência de quantidade de parcelas;
- transição inválida de status;
- evento fora de ordem;
- divergência de identidade do pagador;
- tentativa de sobrescrita inconsistente de campo auditável.

## Tabelas principais

### `validation_failures`

Registra falhas de validação de negócio detectadas durante ingestão.

Responsabilidades:

- classificar a falha por tipo;
- manter vínculo com o item processado;
- manter vínculo com a transação, quando aplicável;
- permitir diagnóstico e testes das regras de validação.

Campos semânticos centrais:

- origem do item;
- PSP;
- identificador externo;
- tipo de falha;
- código da falha;
- mensagem controlada;
- timestamp de criação.

A tabela não representa rejeição formal. Ela representa a falha detectada.

### `rejected_records`

Registra itens formalmente rejeitados.

Responsabilidades:

- preservar a decisão de rejeição;
- registrar motivo e tipo da rejeição;
- manter vínculo com item, execução e, quando aplicável, com a falha de validação que originou a rejeição.

Campos semânticos centrais:

- item rejeitado;
- execução de sincronização;
- PSP;
- identificador externo;
- tipo de rejeição;
- motivo textual controlado;
- timestamp de criação.

A tabela representa a decisão de descarte de negócio do item.

### `data_conflicts`

Registra conflitos de dados e integridade.

Responsabilidades:

- classificar o tipo de conflito;
- manter vínculo com o item recebido;
- manter vínculo com o payload que originou a divergência;
- manter vínculo com a transação consolidada impactada;
- preservar o valor existente e o valor recebido, quando aplicável;
- preparar a abertura de caso de reconciliação.

Campos semânticos centrais:

- item de origem;
- payload relacionado;
- transação impactada;
- tipo do conflito;
- status do conflito;
- severidade;
- valor existente;
- valor recebido;
- data de detecção.

Essa tabela não representa resolução. Ela representa a ocorrência da divergência.

## Relacionamentos principais

A modelagem estabelece os seguintes vínculos:

- `validation_failures` -> `sync_items`
- `validation_failures` -> `transactions` quando aplicável
- `rejected_records` -> `sync_items`
- `rejected_records` -> `validation_failures` quando aplicável
- `rejected_records` -> `sync_runs`
- `data_conflicts` -> `sync_items`
- `data_conflicts` -> `psp_raw_payloads`
- `data_conflicts` -> `transactions`

Esses relacionamentos permitem rastrear a ocorrência desde o item recebido até o efeito no domínio consolidado.

## Classificações mínimas documentadas

### Tipos de falha de validação

- `missing_payer`
- `missing_installments`
- `invalid_payment_method`
- `missing_external_id`
- `invalid_document`
- `incomplete_transaction_data`

### Tipos de rejeição

- `rejected_missing_payer`
- `rejected_missing_installments`
- `rejected_out_of_scope_payment_method`
- `rejected_invalid_required_data`

### Tipos de conflito

- `amount_mismatch`
- `net_amount_mismatch`
- `fees_mismatch`
- `installment_count_mismatch`
- `invalid_status_transition`
- `out_of_order_event`
- `payer_identity_mismatch`
- `audit_field_overwrite_attempt`

### Status de conflito

- `open`
- `under_analysis`
- `resolved`
- `dismissed`

### Severidade

- `low`
- `medium`
- `high`
- `critical`

## Exemplos de uso

### Exemplo 1 — ausência de pagador

Um item chega do PSP sem dados mínimos de pagador.

Fluxo esperado:

1. o item é registrado em `sync_items`
2. a falha é registrada em `validation_failures` com `missing_payer`
3. a rejeição formal é registrada em `rejected_records`

### Exemplo 2 — parcelas incompletas

Um item chega sem conjunto consistente de parcelas.

Fluxo esperado:

1. o item é registrado em `sync_items`
2. a falha é registrada em `validation_failures` com `missing_installments` ou `incomplete_transaction_data`
3. a rejeição formal é registrada em `rejected_records`

### Exemplo 3 — divergência de valor

Um item recebido traz valor bruto diferente do consolidado.

Fluxo esperado:

1. o item é registrado em `sync_items`
2. o payload sanitizado fica em `psp_raw_payloads`
3. o conflito é registrado em `data_conflicts` com `amount_mismatch`
4. o caso pode ser aberto posteriormente em reconciliação

### Exemplo 4 — evento fora de ordem

Um item traz transição de status incompatível com a linha do tempo já consolidada.

Fluxo esperado:

1. o item é registrado em `sync_items`
2. a divergência é registrada em `data_conflicts` com `out_of_order_event` ou `invalid_status_transition`
3. o tratamento posterior passa para reconciliação, quando aplicável

### Exemplo 5 — tentativa de sobrescrita de campo auditável

Uma reimportação tenta alterar campo auditável com valor inconsistente.

Fluxo esperado:

1. o item é recebido e rastreado
2. o conflito é registrado em `data_conflicts` com `audit_field_overwrite_attempt`
3. a consolidação destrutiva não é aplicada automaticamente

## O que esta modelagem evita

Essa modelagem evita:

- tratar problema de negócio como erro técnico;
- sobrescrever estado auditável sem evidência;
- perder divergência em log efêmero;
- misturar rejeição com conflito;
- misturar falha de validação com caso de reconciliação.

## Limites desta modelagem

Esta estrutura não implementa:

- motor de reconciliação;
- resolução automática;
- fila de revisão humana;
- dashboard operacional.

Ela prepara a base relacional para essas capacidades futuras.
