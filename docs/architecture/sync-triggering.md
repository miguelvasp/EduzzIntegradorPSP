# Sync Triggering

## Objetivo

Disponibilizar um mecanismo acionável e controlado para iniciar a sincronização das transações dos PSPs.

Na versão inicial, o mecanismo oficial é **CLI**.

## Por que CLI

A escolha de CLI na v1 atende ao desafio e evita complexidade prematura com endpoint administrativo ou scheduler.

Benefícios:

- execução simples em ambiente local
- fácil demonstração técnica
- baixo acoplamento com transporte
- base reaproveitável para evolução futura

## Componentes

### sync.cli.ts

Entry point operacional.

Responsável por:

- ler argumentos
- chamar o parser
- construir contexto de execução
- chamar o caso de uso principal
- retornar código de saída coerente

### SyncCommandParser

Responsável por:

- interpretar argumentos da CLI
- validar entrada mínima
- rejeitar combinações inválidas
- devolver estrutura pronta para execução

### SyncExecutionContext

Responsável por transportar o contexto mínimo da execução:

- `syncRunId`
- `correlationId`
- `triggeredBy`
- `targetPsp`
- `startedAt`
- `mode`
- `verbose`
- `pageLimit`
- `itemLimit`
- `dryRun`

### RunSyncUseCase

Responsável por:

- decidir PSP alvo ou todos
- resolver strategy pela factory
- iniciar o fluxo de leitura por PSP
- registrar logs estruturados de início, sucesso e falha
- devolver resumo consolidado da execução

## Fluxo

1. CLI recebe argumentos
2. parser valida entrada
3. contexto da execução é criado
4. use case é acionado
5. use case resolve strategy por PSP
6. use case chama listagem inicial
7. resultado consolidado é devolvido ao entrypoint

## Regras importantes

- CLI não deve concentrar lógica pesada de sincronização
- resolução de PSP continua via `PspStrategyFactory`
- fluxo central continua desacoplado de cliente/adapters concretos
- execução deve ser rastreável por `syncRunId` e `correlationId`

## Preparação para evolução futura

Essa base foi desenhada para permitir reutilização futura por:

- endpoint HTTP administrativo
- scheduler
- worker dedicado
- modo dry-run mais rico
