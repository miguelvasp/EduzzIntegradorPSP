# Schema Bootstrap

## Objetivo

Definir como o banco SQL Server do projeto é preparado usando os scripts versionados já existentes no repositório.

## Estratégia

O bootstrap do schema usa os scripts SQL versionados em `scripts/`.

A ordem de execução é:

1. `V001__create_database.sql`
2. `V002__create_core_transaction_tables.sql`
3. `V003__create_operational_tables.sql`
4. `V004__create_indexes.sql`
5. `V005__create_audit_traceability_tables.sql`
6. `V006__create_audit_traceability_indexes.sql`
7. `V007__create_conflict_rejection_reconciliation_tables.sql`
8. `V008__create_conflict_rejection_reconciliation_indexes.sql`

## Regra principal

Os scripts devem ser idempotentes.

Isso significa que:

- subir a aplicação mais de uma vez não deve quebrar;
- tabelas já existentes não devem ser recriadas;
- índices já existentes não devem falhar por duplicidade;
- o bootstrap deve ser seguro em ambiente local e de teste.

## Implementação atual

O componente `SqlServerSchemaBootstrap`:

- lê os arquivos SQL do diretório `scripts/`;
- divide os batches por `GO`;
- executa os batches na ordem definida;
- registra logs estruturados de execução.

## Decisão adotada

Não foi criado um mecanismo concorrente de migration.

O projeto reaproveita os scripts SQL já modelados nas US anteriores.

Essa decisão reduz duplicação, mantém previsibilidade operacional e evita dois caminhos diferentes para o mesmo schema.

## Uso local

Pré-requisitos:

- SQL Server acessível;
- banco configurado no `.env`;
- TCP habilitado na instância quando necessário para conexão pela aplicação.

Com a aplicação subindo corretamente, o bootstrap prepara ou valida o schema automaticamente.

## Resultado esperado

Ao final do bootstrap, a aplicação deve encontrar disponível a base relacional necessária para:

- transações;
- parcelas;
- pagadores;
- checkpoints;
- auditoria;
- evidência;
- conflitos;
- rejeições;
- reconciliação.
