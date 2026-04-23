# Sync HTTP Endpoints

## Objetivo

Expor uma porta de entrada HTTP para a sincronização sem duplicar a lógica da CLI e sem reabrir o núcleo que já está funcionando.

A aplicação já possui sincronização acionável, e o desafio permite que esse acionamento seja feito por comando CLI, endpoint HTTP ou agendamento. O README também precisa explicar como executar a sincronização por comando ou endpoint. :contentReference[oaicite:0]{index=0}

## Princípio adotado

Os endpoints HTTP de sincronização são apenas uma camada fina sobre os mesmos componentes já usados na execução real:

- `SyncExecutionFactory`
- `RunSyncUseCase`
- `RunIncrementalSyncUseCase`

Isso evita duplicação de lógica, mantém a observabilidade já criada e reduz risco de regressão.

## Endpoints

### `POST /sync`

Executa sincronização full.

#### Body

```json
{
  "psp": "pagarme",
  "pageLimit": 1,
  "itemLimit": 20,
  "dryRun": false,
  "verbose": false
}
```
