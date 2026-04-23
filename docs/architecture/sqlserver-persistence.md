# SQL Server Persistence

## Objetivo

Definir a infraestrutura real de persistência do projeto em SQL Server para suportar:

- conexão real com banco;
- pool de conexões;
- bootstrap do schema;
- unidade transacional;
- repositórios concretos;
- wiring no container da aplicação.

## Componentes

### `SqlServerConnection`

Responsável por:

- montar a configuração de acesso ao SQL Server;
- criar e reutilizar o pool de conexões;
- abrir transações quando necessário;
- falhar explicitamente se a configuração estiver inválida ou o banco estiver indisponível.

### `SqlServerSchemaBootstrap`

Responsável por:

- executar os scripts SQL versionados do projeto;
- respeitar a ordem dos arquivos;
- preparar o banco local/teste;
- permitir bootstrap repetido sem erro por meio de scripts idempotentes.

### `SqlServerUnitOfWork`

Responsável por:

- executar trabalho transacional;
- aplicar commit em caso de sucesso;
- aplicar rollback em caso de falha.

### Repositórios concretos

Nesta etapa, a base já possui implementação concreta para o checkpoint de sincronização.

A infraestrutura foi preparada para receber, na mesma linha:

- repositórios de leitura de transações;
- repositórios de parcelas;
- idempotência;
- outbox;
- inbox.

## Estratégia adotada

A aplicação usa SQL Server como banco oficial.

A persistência foi implementada de forma pragmática:

- sem ORM pesado;
- sem acoplamento do domínio ao driver;
- com infraestrutura isolada em camada própria;
- com bootstrap reaproveitando os scripts SQL já existentes no repositório.

## Wiring

A persistência é registrada no container da aplicação durante o bootstrap.

O container passa a expor:

- configuração;
- registry de persistência;
- `UnitOfWork`;
- repositórios concretos disponíveis.

## Regras operacionais

- a conexão depende de configuração externa válida;
- credenciais não devem ser commitadas;
- o `.env.example` documenta variáveis com placeholders;
- o `.env` local contém os valores reais da máquina;
- o banco deve estar acessível via TCP para a aplicação Node.

## Resultado esperado

Com essa base, o projeto deixa de operar apenas com stubs e passa a possuir fundação concreta para:

- sincronização real;
- consulta real;
- rastreabilidade persistida;
- testes integrados;
- evolução de outbox e inbox.
