# Architecture Overview

## Architectural style

The application adopts a **modular monolith** architecture.

This decision was made to balance:

- clarity of organization
- low operational complexity
- separation by business capability
- incremental evolution
- maintainability
- compatibility with integration, synchronization, reconciliation, API and persistence requirements

The project must avoid both extremes:

- an overly generic structure that mixes unrelated responsibilities
- an excessively fragmented structure with low-value abstractions

## High-level project structure

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
  architecture/
```
