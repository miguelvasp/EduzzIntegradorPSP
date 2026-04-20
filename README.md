# Eduzz Integrador PSP

Agregador de transações multi-PSP desenvolvido em Node.js com TypeScript.

## Objetivo

Centralizar transações de cartão de crédito de múltiplos PSPs, garantindo integridade, rastreabilidade, auditabilidade e consulta unificada.

## Stack inicial

- Node.js
- TypeScript
- Fastify
- Vitest

## Estrutura inicial

```text
src/
  app/
    server/
    config/
    container/
    cli/
    workers/

  modules/
    transactions/
    sync/
    reconciliation/
    psp/
    outbox/
    risk/
    shared/

  tests/
    unit/
    integration/
    e2e/

docs/
  backlog/
```

## Documentação de arquitetura

A documentação técnica de arquitetura está disponível em:

- `docs/architecture/overview.md`
- `docs/architecture/modules.md`
- `docs/architecture/conventions.md`
- `docs/architecture/configuration.md`
- `docs/architecture/data-model.md`
- `docs/architecture/database-schema.md`

Backlog versionado:

- `docs/backlog/US-001.md`
- `docs/backlog/US-002.md`

## Catálogos semânticos compartilhados

A aplicação mantém catálogos centralizados para valores canônicos e operacionais em:

```text
src/modules/shared/domain/
  enums/
  constants/
  event-types/
  error-codes/
```

## Banco de dados

O projeto utiliza SQL Server. O banco local esperado para a modelagem atual e `EduzzMultiPsp`.

Os scripts versionados ficam em `scripts/` e devem ser executados nesta ordem:

1. `V001__create_database.sql`
2. `V002__create_core_transaction_tables.sql`
3. `V003__create_operational_tables.sql`
4. `V004__create_indexes.sql`

`V001` cria o banco. Os demais scripts devem ser executados ja no banco `EduzzMultiPsp`, sempre em ordem.

Documentacao tecnica relacionada:

- `docs/architecture/data-model.md`
- `docs/architecture/database-schema.md`

## Variaveis de ambiente

A configuracao da aplicacao e centralizada em `src/app/config/env.ts`. Nenhum outro modulo deve acessar `process.env` diretamente.

### App

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `APP_NAME` | Nome logico da aplicacao. | `eduzz-integrador-psp` | Default `eduzz-integrador-psp` |
| `NODE_ENV` | Ambiente de execucao. Aceita `development`, `test` ou `production`. | `development` | Default `development` |
| `HOST` | Host de bind do servidor HTTP. | `0.0.0.0` | Default `0.0.0.0` |
| `PORT` | Porta de bind do servidor HTTP. | `3000` | Default `3000` |
| `LOG_LEVEL` | Nivel logico de log da aplicacao. | `info` | Default `info` |
| `DOCS_ENABLED` | Habilita recursos de documentacao quando aplicavel. | `true` | Opcional; assume `true` em `development` e `false` nos demais |

### Database

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `DATABASE_HOST` | Host da base de dados. | `localhost` | Default `localhost` |
| `DATABASE_PORT` | Porta da base de dados. | `1433` | Default `1433` |
| `DATABASE_NAME` | Nome da base de dados. | `eduzz_integrador_psp` | Default `eduzz_integrador_psp` |
| `DATABASE_USER` | Usuario de acesso. | `sa` | Default `sa` |
| `DATABASE_PASSWORD` | Senha de acesso. | vazio | Opcional |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Timeout de conexao em milissegundos. | `5000` | Default `5000` |
| `DATABASE_POOL_MIN` | Tamanho minimo do pool. | `1` | Default `1` |
| `DATABASE_POOL_MAX` | Tamanho maximo do pool. | `10` | Default `10`; deve ser maior ou igual a `DATABASE_POOL_MIN` |

### PSP

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `PSP_USE_MOCK_SERVER` | Mantem a subida local sem PSP real. | `true` | Default `true` |
| `PSP_TIMEOUT_MS` | Timeout base para chamadas a PSP. | `10000` | Default `10000` |
| `PSP_RETRY_ATTEMPTS` | Numero de tentativas de retry. | `2` | Default `2` |
| `PAGARME_BASE_URL` | Base URL do provedor Pagar.me. | `http://localhost:4010/pagarme` | Default local |
| `PAGARME_API_KEY` | Credencial do Pagar.me. | vazio | Opcional |
| `MERCADOPAGO_BASE_URL` | Base URL do provedor Mercado Pago. | `http://localhost:4020/mercadopago` | Default local |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial do Mercado Pago. | vazio | Opcional |

### Sync

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `SYNC_PAGE_SIZE` | Tamanho padrao de pagina para sincronizacao. | `20` | Default `20` |
| `SYNC_MAX_PAGE_SIZE` | Limite maximo de pagina. | `100` | Default `100`; deve ser maior ou igual a `SYNC_PAGE_SIZE` |
| `SYNC_INCREMENTAL_WINDOW_MINUTES` | Janela base para cargas incrementais. | `60` | Default `60` |
| `SYNC_SAFETY_OVERLAP_MINUTES` | Sobreposicao de seguranca em minutos. | `5` | Default `5` |

### Security

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `SECURITY_HASH_SALT` | Salt adicional para fluxos de hash quando necessario. | vazio | Opcional |
| `SECURITY_MASK_SENSITIVE_DATA` | Mascara dados sensiveis em saidas operacionais. | `true` | Default `true` |
| `SECURITY_REDACT_SECRETS_IN_LOGS` | Redige segredos em logs. | `true` | Default `true` |

### Observability

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `OBS_STRUCTURED_LOGGING` | Indica uso de logging estruturado. | `true` | Default `true` |
| `OBS_METRICS_ENABLED` | Habilita emissao de metricas quando aplicavel. | `false` | Default `false` |
| `OBS_REQUEST_CORRELATION_ENABLED` | Habilita correlacao de requisicoes. | `true` | Default `true` |

### Cache

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `CACHE_ENABLED` | Liga o uso de cache quando houver implementacao. | `false` | Default `false` |
| `CACHE_TTL_SECONDS` | TTL padrao de cache em segundos. | `60` | Default `60` |

### Outbox

| Variavel | Finalidade | Exemplo | Default/Obrigatoriedade |
| --- | --- | --- | --- |
| `OUTBOX_DISPATCHER_ENABLED` | Liga o dispatcher de outbox quando houver implementacao. | `false` | Default `false` |
| `OUTBOX_BATCH_SIZE` | Tamanho do lote de processamento. | `50` | Default `50` |
| `OUTBOX_POLL_INTERVAL_MS` | Intervalo entre polls do dispatcher. | `5000` | Default `5000` |
| `OUTBOX_RETRY_LIMIT` | Limite de retries por evento. | `3` | Default `3` |
