# Data Model

## Objetivo do modelo de dados

O banco transacional existe para sustentar a persistencia do modelo canonico de transacoes multi-PSP com foco em estado atual, rastreabilidade operacional, auditoria e suporte a sincronizacao incremental. A estrutura separa a representacao consolidada da transacao, o historico de operacao e a evidencia bruta capturada dos PSPs.

## Principios adotados

- uma transacao canonica possui identidade semantica por `psp + external_id`
- o estado atual fica separado do historico operacional
- evidencia externa bruta nao substitui o modelo interno consolidado
- documento do pagador nao e persistido em texto puro
- sincronizacao incremental exige checkpoints e execucoes rastreaveis
- a estrutura favorece consulta futura por API sem depender de payload bruto

## Visao geral das tabelas

O schema foi organizado em tres grupos:

- nucleo transacional: `payers`, `transactions`, `transaction_payer_snapshots`, `installments`
- operacao de sincronizacao: `sync_runs`, `sync_checkpoints`, `idempotency_registry`
- historico e auditoria: `transaction_status_history`, `transaction_events`, `transaction_integration_evidences`

## Nucleo transacional

### `payers`

Responsabilidade:

- guardar a identidade base do pagador conhecida pelo sistema

Papel no sistema:

- servir como cadastro reutilizavel de pagador vinculado a transacoes quando houver correspondencia

Tipo de verdade:

- verdade consolidada do pagador conhecida no contexto transacional

Por que existe separada:

- evita duplicacao desnecessaria de dados compartilhados entre transacoes e permite referenciar um pagador comum sem perder a possibilidade de snapshot historico por transacao

### `transactions`

Responsabilidade:

- representar o estado atual consolidado da transacao no sistema

Papel no sistema:

- ser a principal fonte para consulta operacional, API futura, sincronizacao incremental e consolidacao do status atual

Tipo de verdade:

- verdade canonica atual da transacao

Por que existe separada:

- concentra o estado presente da transacao sem misturar historico de mudancas nem payload bruto externo

### `transaction_payer_snapshots`

Responsabilidade:

- preservar a fotografia historica do pagador associada a cada transacao

Papel no sistema:

- impedir que alteracoes futuras de dados do pagador modifiquem retroativamente o contexto historico da transacao

Tipo de verdade:

- verdade historica do pagador no momento observado para a transacao

Por que existe separada:

- separa o snapshot historico do cadastro base de `payers` e sustenta auditoria sem reescrever o passado

### `installments`

Responsabilidade:

- representar as parcelas canonicas da transacao

Papel no sistema:

- detalhar composicao financeira e estado operacional de cada parcela

Tipo de verdade:

- verdade atual das parcelas da transacao

Por que existe separada:

- uma transacao pode possuir varias parcelas com status e datas proprias, o que exige granularidade relacional especifica

## Operacao de sincronizacao

### `sync_runs`

Responsabilidade:

- registrar cada execucao de sincronizacao

Papel no sistema:

- medir volume processado, status da execucao e falhas consolidadas

Tipo de verdade:

- verdade operacional de cada ciclo de sincronizacao

Por que existe separada:

- isola a telemetria operacional da execucao sem poluir o estado da transacao

### `sync_checkpoints`

Responsabilidade:

- guardar o ultimo ponto conhecido de sincronizacao por fonte e tipo de checkpoint

Papel no sistema:

- viabilizar sincronizacao incremental e retomada segura

Tipo de verdade:

- verdade operacional do progresso incremental por fonte

Por que existe separada:

- checkpoint tem ciclo de vida e cardinalidade diferentes das execucoes e das transacoes

### `idempotency_registry`

Responsabilidade:

- registrar chaves tecnicas de idempotencia

Papel no sistema:

- evitar reprocessamentos semanticos indevidos dentro de um escopo definido

Tipo de verdade:

- verdade tecnica sobre a observacao e o estado de uma chave idempotente

Por que existe separada:

- a estrategia de idempotencia precisa de controle relacional proprio, independente do estado consolidado das transacoes

## Historico e auditoria

### `transaction_status_history`

Responsabilidade:

- registrar mudancas de status da transacao ao longo do tempo

Papel no sistema:

- sustentar auditoria operacional e analise de mudancas de estado

Tipo de verdade:

- verdade historica de transicao de status

Por que existe separada:

- o historico nao deve sobrescrever o estado atual armazenado em `transactions`

### `transaction_events`

Responsabilidade:

- registrar eventos operacionais relevantes ligados a transacao

Papel no sistema:

- manter trilha de eventos internos e operacionais do ciclo de vida da transacao

Tipo de verdade:

- verdade operacional orientada a eventos

Por que existe separada:

- eventos possuem natureza propria e podem carregar payload JSON sem contaminar a tabela principal de transacoes

### `transaction_integration_evidences`

Responsabilidade:

- guardar evidencias brutas capturadas dos PSPs

Papel no sistema:

- sustentar rastreabilidade de integracao, auditoria tecnica e reanalise futura do dado externo recebido

Tipo de verdade:

- verdade bruta externa capturada no momento da integracao

Por que existe separada:

- payload JSON bruto nao deve substituir o modelo canonico nem o historico operacional, mas precisa permanecer disponivel como evidencia

## Relacionamentos principais

- `transactions.payer_id -> payers.id`
- `transaction_payer_snapshots.transaction_id -> transactions.id`
- `transaction_payer_snapshots.payer_id -> payers.id`
- `installments.transaction_id -> transactions.id`
- `sync_checkpoints.last_successful_run_id -> sync_runs.id`
- `transaction_status_history.transaction_id -> transactions.id`
- `transaction_status_history.sync_run_id -> sync_runs.id`
- `transaction_events.transaction_id -> transactions.id`
- `transaction_events.sync_run_id -> sync_runs.id`
- `transaction_integration_evidences.transaction_id -> transactions.id`
- `transaction_integration_evidences.sync_run_id -> sync_runs.id`

## Estrategia de idempotencia

O modelo usa duas camadas complementares:

- `transactions` garante unicidade canonica por `(psp, external_id)`
- `idempotency_registry` guarda chaves tecnicas por `scope + idempotency_key`

Essa combinacao separa a identidade da transacao da gestao operacional de reprocessamento.

## Protecao de dados sensiveis

- o documento do pagador e persistido apenas em `document_hash`
- nao existe coluna de documento em texto puro
- `transaction_payer_snapshots` preserva o contexto historico do pagador sem expor documento bruto
- evidencias JSON ficam restritas a tabelas de auditoria tecnica e nao substituem o modelo consolidado

## Como o modelo suporta API, sync e auditoria

- a API futura pode consultar `transactions`, `payers`, `transaction_payer_snapshots` e `installments` para obter o estado canonico e seus detalhes
- a sincronizacao incremental utiliza `sync_runs` e `sync_checkpoints` para controle de execucao e progresso
- a idempotencia relacional utiliza `transactions` e `idempotency_registry`
- a auditoria operacional utiliza `transaction_status_history` e `transaction_events`
- a auditoria tecnica de integracao utiliza `transaction_integration_evidences` para manter o JSON bruto do PSP
