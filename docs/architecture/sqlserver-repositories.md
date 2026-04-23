# SQL Server Repositories

## Objetivo

Este documento resume os repositórios concretos introduzidos para a persistência real no SQL Server.

O foco é registrar o papel de cada componente sem transformar a documentação em uma bíblia.

## Repositórios implementados

### `SqlServerTransactionPersistenceRepository`

Responsável por:

- localizar transação existente por `psp + externalId`;
- inserir transação nova;
- atualizar transação existente por merge seguro;
- mapear linha persistida de volta para o modelo de domínio quando necessário.

### `SqlServerInstallmentPersistenceRepository`

Responsável por:

- substituir o conjunto de parcelas de uma transação;
- manter consistência entre payload aceito e parcelas persistidas.

### `SqlServerPayerPersistenceRepository`

Responsável por:

- fazer upsert do pagador consolidado;
- salvar snapshot do pagador por transação;
- persistir `documentHash`, nunca documento puro.

### `SqlServerSyncCheckpointRepository`

Responsável por:

- recuperar checkpoint por PSP;
- persistir checkpoint atualizado da sincronização.

### `SqlServerIdempotencyRepository`

Responsável por:

- consultar registro existente a partir da chave lógica;
- registrar decisão de idempotência da sincronização.

### `SqlServerOutboxRepository`

Responsável por:

- persistir mensagens do outbox;
- recuperar mensagens despacháveis;
- marcar processamento, sucesso, retry e dead-letter.

### `SqlServerInboxRepository`

Responsável por:

- registrar mensagens consumidas;
- impedir duplicidade por consumidor;
- marcar processamento, sucesso, falha e duplicidade ignorada.

## Infraestrutura de apoio

### `SqlServerConnection`

Responsável por:

- criar pool de conexão;
- abrir transações;
- fornecer request associado à transação corrente quando houver;
- centralizar acesso ao driver `mssql`.

### `SqlServerUnitOfWork`

Responsável por:

- delimitar a transação;
- executar `commit` em caso de sucesso;
- executar `rollback` em caso de falha;
- permitir consistência entre persistência principal e outbox.

### `SqlServerSchemaBootstrap`

Responsável por:

- executar scripts SQL versionados;
- preparar o schema local/teste;
- reaproveitar o mecanismo já existente no repositório.

## Estratégia adotada

A estratégia é pragmática:

- usar SQL Server diretamente;
- evitar ORM pesado;
- manter infraestrutura isolada;
- respeitar portas da aplicação;
- não acoplar domínio ao driver.

## Resultado esperado

Esses repositórios formam a base concreta para:

- persistência real da sincronização;
- leitura futura pela API;
- outbox e inbox reais;
- evolução de testes integrados;
- rastreabilidade persistida no banco.
