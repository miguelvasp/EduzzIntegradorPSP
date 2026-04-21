# Paginated Incremental Sync

## Objetivo

Executar sincronização dos PSPs de forma:

- paginada
- incremental
- rastreável
- segura para reprocessamento
- sem carga total em memória

## Componentes

### RunIncrementalSyncUseCase

Responsável por:

- resolver PSP alvo ou todos
- ler checkpoint por PSP
- calcular janela incremental
- iterar páginas
- acionar processamento de itens
- atualizar checkpoint ao final

### SyncWindowCalculator

Responsável por calcular a janela incremental.

Regras:

- sem checkpoint: usa lookback inicial
- com checkpoint: aplica overlap de segurança

### SyncCheckpointRepository

Porta para leitura e gravação de checkpoint por PSP.

### SyncPageProcessor

Responsável por processar os itens de cada página de forma iterativa.

### SyncProgressTracker

Responsável por rastrear progresso da execução:

- páginas processadas
- itens lidos
- itens processados
- itens com falha

## Estratégia incremental

A sync usa checkpoint por PSP e overlap de segurança.

### Sem checkpoint

A execução usa uma janela inicial de lookback configurada.

### Com checkpoint

A execução volta alguns minutos antes do último ponto conhecido para reduzir risco de perda de eventos tardios.

## Overlap

O overlap existe para reduzir risco em cenários como:

- atualização tardia no PSP
- instabilidade de paginação
- atraso de propagação
- reexecução após falha

Reprocessar uma janela recente é comportamento esperado.

## Paginação

A paginação específica continua encapsulada nas strategies.

### Pagar.me

- `page`
- `size`

### Mercado Pago

- `offset`
- `limit`

O fluxo central não conhece detalhes de endpoint ou payload do PSP.

## Processamento

A execução ocorre:

- página a página
- item a item

Sem acumular toda a carga em memória antes de começar o processamento.

## Checkpoint

Ao final da etapa elegível, o checkpoint do PSP é atualizado com o ponto mais recente conhecido pela execução.

A estrutura base suporta:

- `lastSyncAt`
- `page`
- `offset`
- `cursor`
- `updatedAt`

## Preparação para próximas histórias

Essa base foi criada para suportar evolução futura com:

- idempotência
- validação de negócio
- rejeição por item
- merge seguro de status
- reconciliação
- persistência operacional detalhada
