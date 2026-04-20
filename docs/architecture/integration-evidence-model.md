# Integration Evidence Model

## Objetivo

Este documento descreve a modelagem de evidência de integração da aplicação, com foco no registro do que foi recebido dos PSPs, em qual contexto o item foi processado e como o sistema preserva rastreabilidade sem acoplar o domínio consolidado ao payload externo.

A US-007 exige modelagem específica para payloads sanitizados, checkpoints, itens processados e trilha de integração, preservando capacidade de auditoria, suporte operacional e diagnóstico. :contentReference[oaicite:2]{index=2}

## Princípios adotados

A modelagem de evidência segue estes princípios:

- separação entre payload externo e estado consolidado;
- preservação de rastreabilidade ponta a ponta;
- armazenamento apenas de payload sanitizado;
- proibição de persistência de documento em texto puro;
- baixo acoplamento entre evidência externa e modelo canônico;
- suporte a diagnóstico e reprocessamento.

## Diferença entre os três níveis de informação

### Estado consolidado

É o que o sistema entende como verdade operacional atual.

Exemplos:

- `transactions`
- `installments`
- `payers`
- `transaction_payer_snapshots`

Esse nível não deve refletir diretamente o payload bruto do PSP.

### Evento interno

É o registro de algo relevante que aconteceu no ciclo de vida do sistema.

Exemplos:

- `transaction_events`
- `transaction_status_history`
- `installment_status_history`

Esse nível registra o comportamento da aplicação, não o contrato externo bruto.

### Evidência de integração

É a prova técnica do que veio externamente e em qual execução foi tratado.

Exemplos:

- `sync_checkpoints`
- `sync_items`
- `psp_raw_payloads`

Esse nível permite auditoria, rastreabilidade e diagnóstico de integração.

## Tabelas centrais de evidência

### `sync_checkpoints`

Representa o último ponto confiável processado por uma origem de sincronização.

Responsabilidades:

- sustentar sincronização incremental;
- registrar cursor, offset, timestamp ou marcador equivalente;
- permitir retomada controlada;
- permitir reprocessamento com overlap.

Essa tabela registra o ponto de progresso confiável da integração.

### `sync_items`

Representa cada item externo recebido, tentado ou processado.

Responsabilidades:

- registrar o item no contexto de uma execução;
- vincular o item à origem e à página/lote quando houver;
- manter o identificador externo do item;
- classificar o resultado do processamento;
- apontar para a transação consolidada quando existir vínculo.

Essa tabela é o elo entre execução técnica, payload recebido e consolidação transacional.

### `psp_raw_payloads`

Representa o payload bruto recebido do PSP, já sanitizado.

Responsabilidades:

- armazenar o conteúdo externo recebido;
- manter vínculo com o item e com a execução;
- registrar hash do payload;
- permitir diagnóstico de divergência, parsing e mapeamento;
- servir como evidência técnica de integração.

Essa tabela existe para que o sistema tenha prova do que foi recebido, sem contaminar o domínio consolidado com estrutura externa.

## Regra de sanitização

Os payloads persistidos em `psp_raw_payloads` devem ser sanitizados antes de armazenamento.

A sanitização deve garantir, no mínimo:

- remoção ou mascaramento de documento em texto puro;
- remoção ou mascaramento de tokens;
- remoção ou mascaramento de credenciais;
- remoção ou mascaramento de segredos operacionais;
- preservação do conteúdo necessário para auditoria técnica.

A US-007 exige explicitamente que payloads armazenados respeitem política de sanitização e proteção de dados sensíveis. :contentReference[oaicite:3]{index=3}

## Proibição de documento em texto puro

Documento do pagador não deve ser persistido em texto puro nas tabelas de evidência operacional.

Regras:

- não persistir CPF/CNPJ puro em `psp_raw_payloads`;
- não persistir documento puro em tabelas de erro;
- preferir hash, mascaramento ou supressão;
- manter aderência à política geral de proteção de dados sensíveis da aplicação.

## Rastreabilidade ponta a ponta

A modelagem permite encadear o fluxo de rastreabilidade assim:

1. uma execução é registrada em `sync_runs`
2. a origem específica é registrada em `sync_run_sources`
3. a página ou lote é registrada em `sync_run_pages`
4. o item recebido é registrado em `sync_items`
5. o payload sanitizado é registrado em `psp_raw_payloads`
6. o item pode ou não gerar uma transação consolidada
7. eventos, históricos e erros complementam a trilha operacional

Esse encadeamento permite responder perguntas como:

- qual payload originou determinado item;
- em qual execução o item foi processado;
- qual foi o resultado do item;
- em qual transação o item foi consolidado;
- qual checkpoint estava em uso;
- qual erro ocorreu no processo.

## Papel do `payload_hash`

O `payload_hash` existe para:

- identificar tecnicamente a carga recebida;
- apoiar comparação entre capturas;
- detectar alteração de evidência;
- permitir troubleshooting sem depender apenas de inspeção visual do JSON.

## O que esta modelagem evita

Essa modelagem evita três erros clássicos:

### 1. Misturar payload bruto com modelo canônico

O domínio consolidado não deve virar espelho das APIs externas.

### 2. Depender apenas de log efêmero

Logs são úteis, mas não substituem evidência persistida.

### 3. Armazenar dado sensível sem controle

Payload bruto sem sanitização cria risco operacional e regulatório.

## Uso operacional esperado

Essa estrutura foi pensada para permitir:

- validação de reimportação sem duplicidade;
- análise de divergência entre payload e modelo canônico;
- suporte a troubleshooting de sync incremental;
- inspeção técnica durante testes;
- demonstração de rastreabilidade na avaliação técnica.

## Limites desta modelagem

Esta estrutura não substitui:

- reconciliação completa;
- data lake;
- storage frio;
- analytics;
- dashboards;
- governança completa de retenção.

Ela prepara a base para auditoria e evidência operacional dentro do escopo do produto.
