# Audit Traceability Model

## Objetivo

Este documento descreve a modelagem de auditoria, rastreabilidade e trilha operacional da sincronização de transações multi-PSP.

O objetivo dessas estruturas não é substituir o estado consolidado do domínio transacional, mas complementar a base principal com evidências e registros operacionais suficientes para:

- rastrear cada execução de sincronização;
- identificar quais fontes, páginas e itens foram processados;
- registrar eventos relevantes do ciclo de vida transacional;
- registrar mudanças de status de transações e parcelas;
- registrar erros técnicos de integração e erros internos de processamento;
- sustentar diagnóstico, troubleshooting, reprocessamento e auditoria operacional.

Essa separação é exigida pela US-007, que determina uma distinção clara entre estado atual de negócio e trilha operacional/evidência de integração. :contentReference[oaicite:0]{index=0}

## Princípios adotados

A modelagem segue os princípios abaixo:

- separação entre estado atual e evidência operacional;
- rastreabilidade ponta a ponta;
- auditabilidade;
- suporte a reprocessamento e troubleshooting;
- baixo acoplamento com o estado consolidado;
- compatibilidade com sincronização incremental;
- preparação para reconciliação futura.

## Separação de responsabilidades

A base foi organizada em três camadas lógicas:

### Estado atual consolidado

Permanece nas tabelas centrais já modeladas anteriormente, como:

- `transactions`
- `installments`
- `payers`
- `transaction_payer_snapshots`

Essas tabelas representam o estado atual conhecido pelo sistema.

### Trilha operacional

Registra o comportamento do sistema durante a sincronização e processamento:

- `sync_runs`
- `sync_run_sources`
- `sync_run_pages`
- `sync_items`
- `integration_errors`
- `processing_errors`

### Histórico de eventos e evolução de estado

Registra o que mudou ao longo do tempo:

- `transaction_events`
- `transaction_status_history`
- `installment_status_history`

## Tabelas de rastreabilidade operacional

### `sync_runs`

Representa a execução principal de sincronização.

Responsabilidades:

- identificar cada execução;
- registrar início e fim;
- registrar status final;
- registrar agregados operacionais da execução;
- servir como âncora para fontes, páginas, itens e erros relacionados.

É o ponto mais alto da trilha operacional.

### `sync_run_sources`

Detalha o comportamento da execução por origem lógica ou PSP.

Responsabilidades:

- desdobrar uma execução principal em fontes específicas;
- permitir rastrear processamento por PSP;
- registrar volume e resultado operacional por origem.

Essa tabela evita que uma execução com múltiplas fontes fique opaca.

### `sync_run_pages`

Registra páginas, offsets, cursores ou lotes consumidos durante a sincronização.

Responsabilidades:

- rastrear paginação utilizada;
- permitir diagnóstico de salto, duplicidade ou falha em página específica;
- registrar progresso técnico da sincronização.

Essa tabela é importante para troubleshooting de fluxos paginados e incrementais.

### `sync_items`

Representa cada item externo recebido, tentado ou processado.

Responsabilidades:

- registrar cada item por execução;
- vincular item à fonte e, quando aplicável, à página;
- manter o identificador externo do item;
- registrar o resultado do processamento;
- vincular item à transação consolidada quando houver consolidação.

Essa tabela permite saber exatamente o que aconteceu com cada item recebido.

## Tabelas de histórico operacional

### `transaction_events`

Registra eventos relevantes do ciclo de vida da transação.

Responsabilidades:

- registrar criação, atualização, rejeição, conflito ou outro evento relevante;
- manter vínculo com a transação consolidada;
- permitir rastreamento operacional sem depender apenas do estado atual.

É uma trilha de eventos, não uma tabela de payload bruto.

### `transaction_status_history`

Registra a linha do tempo de mudança de status da transação.

Responsabilidades:

- preservar o status anterior e o novo status;
- registrar quando a mudança ocorreu;
- registrar origem da mudança;
- apoiar auditoria e diagnóstico de evolução transacional.

Essa tabela responde quando e por que uma transação mudou de estado.

### `installment_status_history`

Registra a linha do tempo de mudança de status das parcelas.

Responsabilidades:

- preservar evolução de cada parcela;
- permitir análise mais detalhada do parcelamento;
- apoiar diagnósticos em cenários onde o estado da transação e das parcelas divergem.

Essa tabela prepara a base para reconciliação mais fina no futuro.

## Tabelas de erro operacional

### `integration_errors`

Registra erros técnicos de integração externa.

Responsabilidades:

- registrar falhas de rede, timeout, autenticação, indisponibilidade ou parsing;
- vincular erro à execução, à fonte, à página e ao item quando aplicável;
- separar falha técnica externa de falha interna de processamento.

Essa distinção é importante para suporte operacional e retry.

### `processing_errors`

Registra erros internos ocorridos após o recebimento do payload.

Responsabilidades:

- registrar falhas de validação, transformação, persistência ou lógica interna;
- vincular erro ao item, à transação e à execução;
- separar erro interno de erro de integração externa.

Essa separação evita misturar problema de contrato externo com problema da aplicação.

## Relacionamentos principais

Os relacionamentos centrais da trilha operacional são:

- `sync_runs` -> `sync_run_sources`
- `sync_runs` -> `sync_run_pages`
- `sync_runs` -> `sync_items`
- `sync_runs` -> `integration_errors`
- `sync_runs` -> `processing_errors`

- `sync_run_sources` -> `sync_run_pages`
- `sync_run_sources` -> `sync_items`
- `sync_run_sources` -> `integration_errors`

- `sync_run_pages` -> `sync_items`
- `sync_run_pages` -> `integration_errors`

- `sync_items` -> `transactions` quando há consolidação
- `transaction_events` -> `transactions`
- `transaction_status_history` -> `transactions`
- `installment_status_history` -> `installments`

## Classificação de resultado de processamento

A tabela `sync_items` suporta resultados operacionais como:

- `received`
- `processed`
- `inserted`
- `updated`
- `ignored`
- `rejected`
- `conflicted`
- `failed`

Essas classificações são essenciais para auditoria, reprocessamento e troubleshooting, conforme previsto na US-007. :contentReference[oaicite:1]{index=1}

## Perguntas que essa modelagem responde

Com essa estrutura, o sistema consegue responder perguntas como:

- qual foi a última execução concluída por PSP;
- quantas páginas foram processadas;
- quais itens foram inseridos, rejeitados ou falharam;
- em que execução determinado item foi processado;
- quando o status de uma transação mudou;
- quando o status de uma parcela mudou;
- qual erro técnico externo impediu o processamento;
- qual erro interno ocorreu após o recebimento do item.

## Limites desta modelagem

Esta modelagem não substitui:

- reconciliação completa;
- métricas analíticas;
- dashboards;
- outbox;
- risk engine;
- dead-letter;
- trilhas completas de negócio sensível.

Ela prepara a base para essas evoluções, sem misturar estado atual com trilha operacional.
