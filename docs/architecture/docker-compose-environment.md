# Arquitetura do Ambiente Docker Compose

## Objetivo

Documentar como o ambiente local é montado via Docker Compose para garantir uma execução funcional do fluxo principal do projeto.

O foco desta arquitetura não é “subir container”.  
O foco é permitir que qualquer avaliador ou desenvolvedor consiga:

1. subir o ambiente;
2. ter banco utilizável;
3. ter mock server disponível;
4. ter a API funcionando;
5. disparar sincronização;
6. consultar os endpoints obrigatórios.

## Serviços do ambiente

O ambiente Compose é formado por quatro serviços:

- `db`
- `db-bootstrap`
- `mock-server`
- `app`

## Responsabilidade de cada serviço

### `db`

Responsável por disponibilizar o SQL Server usado pela aplicação.

Função no ambiente:

- armazenar transações;
- armazenar parcelas;
- armazenar pagadores;
- armazenar execuções de sync;
- armazenar checkpoints, conflitos, rejeições e estruturas operacionais.

Decisão adotada:

- uso de `mcr.microsoft.com/mssql/server:2022-latest`;
- volume persistente para manter o estado local entre execuções;
- healthcheck próprio para garantir que o SQL Server está realmente aceitando conexão.

### `db-bootstrap`

Responsável por garantir a existência do banco antes da aplicação subir.

Função no ambiente:

- conectar no SQL Server já iniciado;
- criar o banco `EduzzMultiPsp` caso ele ainda não exista.

Essa separação existe porque o bootstrap interno da aplicação executa apenas os scripts de schema versionado, mas pressupõe que o banco já exista.

Sem esse serviço, o ambiente fica frágil:

- o SQL Server sobe;
- mas a aplicação pode tentar inicializar schema em um banco que ainda não foi criado.

### `mock-server`

Responsável por simular os PSPs no ambiente local.

Função no ambiente:

- expor contrato compatível com Pagar.me;
- expor contrato compatível com Mercado Pago;
- permitir testes locais sem credenciais reais;
- suportar sincronização ponta a ponta.

Esse serviço é parte da arquitetura funcional do ambiente, não um acessório.

### `app`

Responsável por executar a API principal.

Função no ambiente:

- subir servidor HTTP;
- expor `/health`;
- expor endpoints de consulta;
- expor endpoints de sync;
- registrar persistência SQL Server;
- executar bootstrap de schema;
- integrar com mock server ou PSP real por configuração.

## Ordem de inicialização

A ordem correta do ambiente é esta:

1. `db` sobe;
2. `db-bootstrap` executa a criação do banco;
3. `mock-server` sobe;
4. `app` sobe;
5. a própria aplicação executa os scripts versionados de schema no startup.

## Estratégia de coordenação

### Banco

O `app` depende de:

- `db-bootstrap` com `service_completed_successfully`

Isso impede que a API tente iniciar antes da criação do banco.

### Mock server

O `app` depende de:

- `mock-server` com `service_started`

Essa decisão é proposital.

Esperar `service_healthy` para liberar a API travou a subida do ambiente sem necessidade.  
A aplicação não precisa que o mock esteja “healthy” para subir.  
Ela só precisa que o mock esteja acessível quando a sync for executada.

Então a escolha foi pragmática:

- o mock precisa iniciar;
- a API não fica bloqueada desnecessariamente.

## Bootstrap do banco

O fluxo de bootstrap foi dividido em duas camadas.

### Camada 1 — criação do banco

Feita pelo `db-bootstrap`.

Responsabilidade:

- garantir que `EduzzMultiPsp` exista.

### Camada 2 — criação de schema

Feita pela própria aplicação no startup.

Responsabilidade:

- executar scripts versionados de schema;
- criar tabelas, índices e estruturas necessárias;
- manter o ambiente utilizável sem intervenção manual obscura.

## Nome do banco

O ambiente Docker Compose foi alinhado com o banco realmente esperado pelo projeto:

```text
EduzzMultiPsp
```

Esse alinhamento é crítico.

Se o Compose apontar para outro nome de banco, o ambiente pode até parecer “de pé”, mas a aplicação falha ou roda em estado inconsistente.

Portas expostas

As portas padrão do ambiente são:

1433 — SQL Server
3334 — mock server
3000 — aplicação
Configuração de PSP no ambiente Docker

No ambiente Docker local, a aplicação aponta para o mock server usando o nome do serviço na rede interna do Compose.

Exemplo conceitual:

PAGARME_BASE_URL=http://mock-server:3334
MERCADOPAGO_BASE_URL=http://mock-server:3334

Ponto importante:

a base URL não deve repetir o prefixo de rota que o cliente HTTP já monta internamente;
localhost não serve para comunicação entre containers;
o nome correto é o nome do serviço Docker na rede do Compose.
Configuração do banco no ambiente Docker

No ambiente Docker local, a aplicação usa:

DATABASE_HOST=db
DATABASE_PORT=1433
DATABASE_NAME=EduzzMultiPsp

Isso garante que a API converse com o container do SQL Server, não com a máquina host.

Healthchecks
db

Existe healthcheck real para confirmar que o SQL Server aceita conexão.

mock-server

Existe healthcheck HTTP simples para validar que o servidor está respondendo.

app

Existe healthcheck via /health para confirmar que a API subiu corretamente.

Fluxo operacional validado

O fluxo principal validado neste ambiente foi:

subir ambiente com docker compose up;
validar GET /health;
executar sync do Pagar.me;
executar sync do Mercado Pago;
consultar GET /transactions;
consultar endpoints de detalhe;
reexecutar sync sem duplicar transações na listagem da API.
Decisões pragmáticas adotadas
Uso de bind mount no código

O serviço app e o mock-server montam o código local com volume.

Motivo:

simplifica desenvolvimento local;
reduz atrito de teste;
evita fluxo de imagem “bonita” mas lenta para iteração.
npm install no startup do container

Foi mantido para simplicidade operacional local.

Não é a abordagem mais enxuta para produção.
Mas para o desafio, reduz setup manual e facilita reprodutibilidade na máquina do avaliador.

Serviço de bootstrap separado

Foi adotado porque resolve o problema real sem inventar mecanismo complexo de migration runner externo.

Limites desta arquitetura

Esta arquitetura é local e pragmática.

Ela não tenta resolver:

produção;
alta disponibilidade;
escalabilidade horizontal;
hardening de imagem;
orquestração com Kubernetes;
segregação avançada de rede;
pipeline de deploy.

Não porque isso seja irrelevante, mas porque não é o problema do desafio.

Resultado esperado do ambiente

Quando o ambiente está correto, o sistema entrega:

banco disponível;
API disponível;
mock server disponível;
sincronização executável;
consulta funcional;
fluxo reproduzível com poucos passos.
