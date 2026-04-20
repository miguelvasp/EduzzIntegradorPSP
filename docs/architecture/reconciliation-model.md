# Reconciliation Model

## Objetivo

Este documento descreve a modelagem de reconciliação da aplicação, com foco nos casos que exigem tratamento controlado após a detecção de conflitos, inconsistências ou lacunas operacionais.

A US-008 exige modelagem específica para casos de reconciliação e para o histórico de ações aplicadas a esses casos, preservando rastreabilidade, auditabilidade e integridade do estado consolidado. :contentReference[oaicite:1]{index=1}

## Princípios adotados

A modelagem de reconciliação segue os princípios abaixo:

- reconciliação é distinta de rejeição;
- reconciliação é distinta de conflito;
- um conflito pode originar um caso;
- um caso pode evoluir por múltiplas ações;
- o histórico do caso não deve depender de logs efêmeros;
- o tratamento deve preservar rastreabilidade ponta a ponta.

## Diferença entre conflito e caso de reconciliação

### Conflito

Conflito é a divergência detectada entre item recebido e estado consolidado.

Exemplos:

- divergência financeira;
- transição inválida de status;
- evento fora de ordem;
- divergência de identidade;
- tentativa de sobrescrita de campo auditável.

O conflito registra o problema detectado.

### Caso de reconciliação

Caso de reconciliação é a instância operacional criada para tratar um problema que exige decisão controlada.

O caso consolida a ocorrência em uma unidade tratável pelo sistema e, futuramente, por automação ou operação assistida.

Em resumo:

- `data_conflicts` registra a divergência
- `reconciliation_cases` registra o caso aberto para tratar essa divergência

## Tabelas principais

### `reconciliation_cases`

Tabela principal dos casos de reconciliação.

Responsabilidades:

- consolidar a ocorrência em um caso tratável;
- classificar o caso por tipo;
- registrar severidade;
- manter o estado atual do caso;
- manter vínculo com conflito, item e transação quando aplicável;
- representar o ciclo de vida do caso até a resolução.

Campos semânticos centrais:

- conflito relacionado;
- item relacionado;
- transação relacionada;
- PSP;
- identificador externo;
- tipo do caso;
- status do caso;
- severidade;
- data de abertura;
- data de resolução.

Essa tabela representa o estado atual do caso.

### `reconciliation_actions`

Tabela de histórico de ações do caso.

Responsabilidades:

- registrar tudo o que foi feito no caso;
- preservar tentativas, decisões e transições relevantes;
- manter rastreabilidade temporal do tratamento.

Campos semânticos centrais:

- caso relacionado;
- tipo da ação;
- status da ação;
- notas controladas;
- data da ação;
- data de criação do registro.

Essa tabela representa a linha do tempo do tratamento.

## Relacionamentos principais

Os relacionamentos centrais da reconciliação são:

- `reconciliation_cases` -> `data_conflicts`
- `reconciliation_cases` -> `sync_items`
- `reconciliation_cases` -> `transactions`
- `reconciliation_actions` -> `reconciliation_cases`

Esses vínculos permitem reconstruir o caminho:

1. item recebido
2. conflito detectado
3. caso aberto
4. ações executadas
5. resolução ou encerramento

## Tipos mínimos de caso

A modelagem documenta os seguintes tipos mínimos:

- `financial_divergence`
- `status_inconsistency`
- `data_incompleteness`
- `identity_inconsistency`
- `unresolved_conflict`

### Interpretação dos tipos

#### `financial_divergence`

Usado quando há divergência material de valores, taxas ou parcelamento.

#### `status_inconsistency`

Usado quando a linha do tempo de status não é consistente.

#### `data_incompleteness`

Usado quando falta informação relevante para consolidação ou correção.

#### `identity_inconsistency`

Usado quando há divergência de identidade do pagador ou referência associada.

#### `unresolved_conflict`

Usado como classificação genérica quando um conflito permanece sem resolução específica.

## Status mínimos do caso

A modelagem documenta os seguintes status mínimos:

- `open`
- `pending_reprocessing`
- `under_review`
- `auto_resolved`
- `resolved`
- `closed_without_change`

### Interpretação dos status

#### `open`

Caso recém-aberto e ainda sem tratamento aplicado.

#### `pending_reprocessing`

Caso aguardando reprocessamento controlado.

#### `under_review`

Caso em análise controlada.

#### `auto_resolved`

Caso resolvido automaticamente pelo sistema.

#### `resolved`

Caso resolvido com decisão aplicada.

#### `closed_without_change`

Caso encerrado sem alteração do estado consolidado.

## Severidade

A modelagem adota severidade estruturada para apoiar priorização:

- `low`
- `medium`
- `high`
- `critical`

A severidade não substitui o status do caso.
Ela indica impacto e urgência operacional.

## Histórico de ações

A tabela `reconciliation_actions` documenta o que foi feito ao longo do caso.

Tipos mínimos de ação documentados:

- `opened`
- `reprocessed`
- `marked_for_review`
- `auto_resolved`
- `discarded`
- `closed`

Status mínimos de ação documentados:

- `requested`
- `completed`
- `failed`

## Exemplos de fluxo

### Exemplo 1 — conflito financeiro

1. um item chega com divergência de valor
2. o conflito é registrado em `data_conflicts`
3. abre-se um caso em `reconciliation_cases` com `financial_divergence`
4. registra-se ação `opened`
5. uma tentativa de reprocessamento é registrada em `reconciliation_actions`
6. o caso é resolvido ou encerrado

### Exemplo 2 — evento fora de ordem

1. um item traz evento fora de ordem
2. o conflito é registrado em `data_conflicts`
3. um caso é aberto com `status_inconsistency`
4. o caso pode ir para `under_review` ou `pending_reprocessing`
5. todas as decisões ficam registradas em `reconciliation_actions`

### Exemplo 3 — conflito sem mudança consolidada

1. o conflito é detectado
2. o caso é aberto
3. a análise conclui que não haverá alteração no estado consolidado
4. uma ação é registrada
5. o caso é encerrado com `closed_without_change`

## Rastreabilidade ponta a ponta

Essa modelagem permite rastrear:

- qual item originou o problema;
- qual conflito foi detectado;
- qual transação foi impactada;
- qual caso foi aberto;
- quais ações foram executadas;
- qual foi o desfecho do caso.

Essa rastreabilidade é necessária para auditoria, troubleshooting e evolução futura do motor de reconciliação. :contentReference[oaicite:2]{index=2}

## O que esta modelagem evita

Ela evita:

- tratar conflito diretamente com update destrutivo;
- perder a trilha de decisão do caso;
- misturar rejeição de negócio com reconciliação;
- depender apenas de log efêmero para explicar uma decisão;
- colapsar múltiplas tentativas de tratamento em um único status final.

## Limites desta modelagem

Esta estrutura não implementa:

- motor automático de reconciliação;
- workflow humano de revisão;
- regras detalhadas de merge;
- dashboard operacional;
- integração com sistemas externos de case management.

Ela prepara a base relacional e a rastreabilidade necessária para essas capacidades futuras.
