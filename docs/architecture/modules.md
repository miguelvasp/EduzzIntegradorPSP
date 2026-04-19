# Módulos da Aplicação

## Visão geral

A aplicação é organizada por capacidade de negócio e responsabilidade técnica, evitando agrupamentos genéricos por tipo técnico global.

Cada módulo deve ter responsabilidade clara, alta coesão interna e baixo acoplamento com os demais módulos.

## Módulos principais

### transactions

Responsável pelo modelo canônico de transações, leitura, consulta e persistência das transações e entidades relacionadas.

Exemplos de responsabilidades:

- entidade de transação
- entidade de parcela
- entidade de pagador
- repositórios de leitura e escrita
- casos de uso de consulta
- regras centrais de consistência da transação

### sync

Responsável pela orquestração da sincronização incremental com PSPs.

Exemplos de responsabilidades:

- paginação
- checkpoints
- reprocessamento incremental
- coordenação de importação
- tratamento isolado por item
- controle de execução da sincronização

### reconciliation

Responsável por tratar divergências e consolidação segura de informações.

Exemplos de responsabilidades:

- conflito de status
- divergência de valores
- eventos fora de ordem
- consolidação de atualização de transação
- políticas de reconciliação

### psp

Responsável pelas integrações externas com os provedores de pagamento.

Exemplos de responsabilidades:

- clientes HTTP dos PSPs
- adapters de payload externo
- strategies por PSP
- factories de resolução por provedor
- contratos externos
- mapeamento do modelo externo para o modelo canônico

### outbox

Responsável pela publicação confiável de eventos internos em cenários transacionais.

Exemplos de responsabilidades:

- registro de eventos internos
- despacho de outbox
- controle de publicação
- rastreabilidade de eventos

### risk

Responsável por sinais de risco e avaliações operacionais básicas.

Exemplos de responsabilidades:

- marcação de atenção operacional
- sinais simples de inconsistência
- regras futuras de antifraude

### shared

Responsável apenas por componentes transversais com reuso comprovado e responsabilidade clara.

Exemplos aceitáveis:

- tipos compartilhados
- utilitários estritamente reutilizáveis
- contratos técnicos comuns
- abstrações realmente transversais

## Regra de uso dos módulos

Nenhum módulo deve virar depósito genérico de código.

Regras:

- lógica de transação não deve ir para `shared`
- integração externa não deve ir para `transactions`
- regra de reconciliação não deve ir para `sync`
- composição concreta não deve ir para `domain`
- detalhes de framework não devem entrar no domínio

## Objetivo da separação

A separação por módulos existe para:

- facilitar manutenção
- reduzir acoplamento
- organizar evolução incremental
- melhorar revisão de código
- permitir testes por responsabilidade
