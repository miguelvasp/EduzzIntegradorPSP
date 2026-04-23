# Transaction Installments Endpoint

## Objetivo

Documentar a consulta de parcelas na API.

Hoje a aplicação suporta duas formas de acesso ao detalhe de parcela:

- `GET /transactions/:id/installments`
- `GET /transactions/:transactionId/installments/:installmentId`
- `GET /installments/:id`

A rota nova `GET /installments/:id` foi adicionada para simplificar validação manual, melhorar a experiência no Swagger e alinhar a API ao que o desafio espera para consulta de parcela isolada.

## Endpoints cobertos

### 1. Listagem das parcelas da transação

```text
GET /transactions/:id/installments
```

Retorna todas as parcelas da transação, ordenadas por número da parcela.

### 2. Detalhe da parcela pela rota composta

```text
GET /transactions/:transactionId/installments/:installmentId
```

Retorna uma parcela específica validando ao mesmo tempo:

- a transação;
- a parcela.

### 3. Detalhe da parcela pela rota alias

```text
GET /installments/:id
```

Retorna a parcela diretamente pelo identificador único da parcela.

## Motivo da rota alias

A rota composta continua útil para contexto transacional.
Mas para teste manual e documentação navegável, ela é mais trabalhosa do que precisa.

A rota alias resolve isso:

- facilita uso no Swagger;
- simplifica chamadas diretas;
- reduz atrito de demonstração;
- não quebra a rota já existente.

A decisão foi **aditiva**, não de substituição.

## Regras de entrada

### `GET /transactions/:id/installments`

- `id` deve ser inteiro positivo;
- valor inválido deve retornar `400`;
- transação inexistente deve retornar `404`.

### `GET /transactions/:transactionId/installments/:installmentId`

- `transactionId` deve ser inteiro positivo;
- `installmentId` deve ser inteiro positivo;
- valor inválido deve retornar `400`;
- combinação inexistente deve retornar `404`.

### `GET /installments/:id`

- `id` deve ser inteiro positivo;
- valor inválido deve retornar `400`;
- parcela inexistente deve retornar `404`.

## Estrutura de resposta

### Listagem de parcelas

A listagem retorna uma coleção com campos como:

- `id`
- `transactionId`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `dueAt`
- `paidAt`
- `updatedAt`

### Detalhe da parcela

O detalhe isolado retorna a mesma visão principal da parcela:

- `id`
- `transactionId`
- `installmentNumber`
- `amount`
- `fees`
- `status`
- `dueAt`
- `paidAt`
- `updatedAt`

## Persistência e leitura

A leitura é feita sobre o estado persistido real no SQL Server.

Não existe montagem em memória para responder esses endpoints.
O fluxo correto é:

1. sync persiste transação e parcelas;
2. consulta usa repositório SQL Server;
3. presenter serializa a resposta HTTP.

## Reuso de fluxo

A rota alias não criou um caso de uso paralelo.

O mesmo fluxo de detalhe foi reaproveitado com pequena adaptação de entrada:

- quando vier `transactionId + installmentId`, a busca considera os dois;
- quando vier apenas `id`, a busca considera somente `installmentId`.

Isso evita duplicação desnecessária.

## Contrato de erro

Os cenários principais são:

- `400` para parâmetro inválido;
- `404` para recurso não encontrado;
- `500` para falha interna segura.

A resposta segue o contrato HTTP padronizado da aplicação.

## Relação com o Swagger

Esses endpoints estão documentados no Swagger em `/docs`.

A rota `GET /installments/:id` foi adicionada justamente para deixar a documentação mais útil e mais fácil de validar manualmente.
