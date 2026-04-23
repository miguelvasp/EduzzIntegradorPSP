# Actionable Sync

## Objetivo

Este documento descreve o mecanismo acionável da sincronização real da aplicação.

A sincronização deixa de ser apenas um pipeline interno e passa a possuir uma porta de entrada operacional reproduzível via CLI.

## Estratégia adotada

A aplicação reutiliza o pipeline central já existente de sincronização.

Não foi criado fluxo paralelo.

O acionamento real ocorre por:

- CLI da aplicação;
- contexto de execução rastreável;
- uso das strategies reais de PSP;
- persistência real no SQL Server.

## Comportamento

Ao disparar a sincronização via CLI, o sistema:

1. interpreta os parâmetros recebidos;
2. cria um contexto de execução com `syncRunId` e `correlationId`;
3. resolve o PSP alvo quando informado;
4. executa o pipeline real de sincronização;
5. processa páginas e itens;
6. persiste os dados válidos no banco;
7. atualiza checkpoint;
8. registra outbox, rejeições e conflitos quando aplicável;
9. devolve um resultado observável da execução.

## Parâmetros operacionais

A execução pode receber, no mínimo:

- PSP alvo;
- `pageLimit`;
- `itemLimit`;
- `verbose`;
- `dryRun`.

## Resultado observável

A execução gera resultado rastreável por:

- `syncRunId`
- `correlationId`
- status final
- PSPs alvo
- contagem de páginas
- contagem de itens
- timestamps da execução

## Compatibilidade

O mecanismo funciona com:

- ambiente local;
- SQL Server real;
- mock server por configuração;
- logs estruturados já implantados no projeto.

## Resultado esperado

Com isso, a sincronização se torna operável de verdade para:

- uso local;
- demonstração;
- troubleshooting;
- testes de integração futuros.
