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
