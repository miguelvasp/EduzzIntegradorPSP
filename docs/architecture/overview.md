# Visão Geral da Arquitetura

## Objetivo

Este projeto centraliza transações de cartão de crédito de múltiplos PSPs em uma API única com:

- sincronização acionável;
- persistência real em SQL Server;
- consulta HTTP;
- idempotência;
- rastreabilidade operacional;
- documentação navegável via Swagger/OpenAPI.

## Estilo arquitetural

A solução segue um modelo de **monólito modular**.

Isso foi escolhido porque o desafio exige clareza, previsibilidade local e baixo atrito de execução. Separar em microsserviços aqui seria custo sem retorno.

## Estrutura principal

```text
src/
  app/
    cli/
    config/
    container/
    server/
    workers/

  modules/
    psp/
    sync/
    transactions/
    reconciliation/
    outbox/
    risk/
    shared/

docs/
  architecture/
  backlog/
```

## Leitura por responsabilidade

### `src/app`

Camada de bootstrap e composição.

Responsabilidades:

- carregar configuração;
- validar ambiente;
- registrar persistência;
- montar container;
- iniciar servidor HTTP;
- registrar Swagger em `/docs`.

### `src/modules/psp`

Camada de integração com Pagar.me e Mercado Pago.

Responsabilidades:

- cliente HTTP por PSP;
- adapter de payload externo;
- strategy por PSP;
- resolução do provedor.

### `src/modules/sync`

Camada de execução da sincronização.

Responsabilidades:

- sync padrão;
- sync incremental;
- checkpoints;
- persistência operacional;
- tratamento isolado por item;
- resumo de execução.

### `src/modules/transactions`

Camada de consulta HTTP sobre o estado persistido.

Responsabilidades:

- listagem de transações;
- detalhe da transação;
- parcelas da transação;
- detalhe da parcela;
- pagador da transação.

## Fluxo principal

### 1. Subida da aplicação

1. o bootstrap carrega e valida configuração;
2. a persistência SQL Server é registrada;
3. o schema é aplicado no startup;
4. o servidor Fastify sobe;
5. o Swagger é publicado em `/docs`.

### 2. Fluxo de sincronização

1. CLI ou HTTP dispara a sync;
2. o caso de uso resolve a strategy do PSP;
3. o cliente HTTP consulta o provedor;
4. o adapter traduz o payload externo;
5. o pipeline processa itens e páginas;
6. a persistência grava transação, parcelas, pagador e estruturas operacionais;
7. a execução devolve resumo rastreável.

### 3. Fluxo de consulta

1. a API recebe a requisição;
2. o controller chama o caso de uso;
3. o repositório SQL Server lê o estado persistido;
4. o presenter serializa a resposta segura;
5. a API responde sem expor `document` puro.

## Endpoints principais

A API expõe, no mínimo:

- `GET /transactions`
- `GET /transactions/:id`
- `GET /transactions/:id/installments`
- `GET /transactions/:transactionId/installments/:installmentId`
- `GET /installments/:id`
- `GET /transactions/:transactionId/payer`

## Swagger / OpenAPI

A documentação navegável da API é publicada em:

- `GET /docs`

O Swagger documenta os endpoints de consulta mais importantes, com contratos de:

- sucesso;
- paginação;
- erro.

A documentação foi alinhada ao contrato real da API, inclusive nos tipos realmente retornados.

## Ambiente local funcional

O ambiente local validado usa:

- `db`
- `db-bootstrap`
- `mock-server`
- `app`

Esse ambiente já suporta:

1. subida com Docker Compose;
2. sync real contra mock server;
3. consulta real no banco;
4. navegação manual via Swagger.

## Decisões de desenho

### O que foi priorizado

- fluxo real antes de arquitetura ornamental;
- separação de responsabilidades;
- baixo acoplamento entre integração e domínio;
- ambiente local reproduzível;
- documentação navegável para validação manual.

### O que foi evitado

- microsserviço sem necessidade;
- duplicação de fluxo entre CLI e HTTP;
- documentação bonita mas mentirosa;
- exposição de dado sensível na API.
