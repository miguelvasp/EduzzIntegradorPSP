# Eduzz Integrador PSP

Agregador de transações multi-PSP desenvolvido em Node.js com TypeScript e SQL Server.

## Objetivo

Centralizar transações de cartão de crédito de múltiplos PSPs, garantindo integridade, rastreabilidade, auditabilidade e consulta unificada.

## Stack

- Node.js
- TypeScript
- Fastify
- SQL Server
- Docker Compose
- Vitest

## Estrutura do projeto

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
