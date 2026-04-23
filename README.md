# Eduzz Integrador PSP

Agregador de transações multi-PSP desenvolvido em **Node.js + TypeScript + SQL Server**, com foco em:

- sincronização acionável;
- persistência real;
- API de consulta;
- idempotência;
- documentação navegável;
- operação local reproduzível.

---

## 1. Visão geral

Este projeto centraliza transações de cartão de crédito de múltiplos PSPs em uma API única com:

- ambiente local funcional via Docker Compose;
- mock server integrado;
- sync padrão e incremental;
- consulta real ao banco;
- Swagger em `/docs`;
- health e readiness;
- documentação de apoio para avaliação.

O projeto foi planejado de forma incremental, com backlog versionado em:

- `docs/backlog`

A documentação técnica complementar está em:

- `docs/architecture`

A documentação de testes guiados está em:

- `docs/testing.md`

O checklist final de aderência ao edital está em:

- `docs/checklist.md`

O roteiro da demonstração está em:

- `docs/demo.md`

## Consultas e validação no banco de dados

A API cobre a consulta operacional principal da solução, mas o banco armazena muito mais informação de execução, rastreabilidade e suporte à auditoria do que aquilo que aparece nos endpoints HTTP.

Para inspecionar esse nível mais profundo, consulte:

- `docs/database-query-guide.md`

Esse guia reúne consultas prontas para validar, no SQL Server:

- execuções de sincronização (`sync_runs`, `sync_run_sources`, `sync_run_pages`);
- itens recebidos e payload bruto sanitizado (`sync_items`, `psp_raw_payloads`);
- consolidação do estado atual (`transactions`, `installments`, `payers`, `transaction_payer_snapshots`);
- idempotência, checkpoints e outbox (`idempotency_registry`, `sync_checkpoints`, `outbox_messages`);
- rejeições, conflitos e erros (`validation_failures`, `rejected_records`, `data_conflicts`, `reconciliation_cases`, `integration_errors`, `processing_errors`);
- histórico e evidências de integração (`transaction_events`, `transaction_status_history`, `installment_status_history`, `transaction_integration_evidences`).

Esse material é útil principalmente para:

- demonstrar persistência real além da API;
- investigar falhas, rejeições e conflitos;
- comprovar rastreabilidade e idempotência;
- conduzir consultas de apoio durante a demonstração técnica.

---

## 2. Stack principal

- **Node.js**
- **TypeScript**
- **Fastify**
- **SQL Server**
- **Docker Compose**
- **Vitest**
- **Swagger / OpenAPI**

---

## 3. O que a solução entrega

### Fluxo principal

A solução permite:

1. subir ambiente local com banco, app e mock server;
2. validar liveness e readiness;
3. disparar sincronização via HTTP ou CLI;
4. persistir transações, parcelas e pagador;
5. consultar dados reais persistidos;
6. navegar a API via Swagger em `/docs`.

### PSPs suportados

- **Pagar.me**
- **Mercado Pago**

### Endpoints principais

- `GET /health`
- `GET /ready`
- `POST /sync`
- `POST /sync/incremental`
- `GET /transactions`
- `GET /transactions/:id`
- `GET /transactions/:id/installments`
- `GET /transactions/:transactionId/installments/:installmentId`
- `GET /installments/:id`
- `GET /transactions/:transactionId/payer`
- `GET /docs`

---

## 4. Organização do repositório

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

---

## 5. Como subir o projeto

## Pré-requisitos

Você precisa ter instalado:

- **Docker Desktop**
- **Node.js**
- **npm**

No Windows:

1. abra o **Docker Desktop**;
2. espere ele ficar como **Running**;
3. abra o terminal na pasta do projeto.

Exemplo:

```bash
cd D:\Projetos\EduzzIntegradorPSP
```

### Limpar ambiente antigo

```bash
docker compose down -v
```

### Subir tudo

```bash
docker compose up --build
```

Esse comando sobe:

- `db` — SQL Server
- `db-bootstrap` — criação inicial do banco
- `mock-server` — mock local dos PSPs
- `app` — API principal

Aguardar até subir todos os ambientes, isto pode levar alguns segundos.

Esse comando sobe o ambiente mesmo sem arquivo `.env`, porque o `docker-compose.yml` usa defaults seguros de demo.

Se você quiser customizar variáveis ou rodar fora do Docker:

1. copie `.env.example` para `.env`
2. ajuste os valores necessários

### Portas principais

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Mock server: `http://localhost:3334`
- SQL Server: `localhost:1433`

---

## 6. Como validar que a aplicação está viva e pronta

### Liveness

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{ "status": "ok" }
```

### Readiness

```bash
curl http://localhost:3000/ready
```

Resposta esperada com banco disponível:

```json
{
  "status": "ready",
  "checks": {
    "app": "ok",
    "database": "ok"
  }
}
```

### Diferença entre os dois

- `/health` = processo vivo
- `/ready` = serviço pronto para operar

---

## 7. Como abrir o Swagger

Abra no navegador:

```text
http://localhost:3000/docs
```

---

## 8. Como popular o banco com dados

Depois de subir o ambiente, o banco pode estar vazio.  
Então o próximo passo é disparar a sync.

### Sync do Pagar.me

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{\"psp\":\"pagarme\"}"
```

### Sync do Mercado Pago

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{\"psp\":\"mercadopago\"}"
```

### Sync incremental

```bash
curl -X POST http://localhost:3000/sync/incremental -H "Content-Type: application/json" -d "{\"psp\":\"pagarme\"}"
```

ou

```bash
curl -X POST http://localhost:3000/sync/incremental -H "Content-Type: application/json" -d "{\"psp\":\"mercadopago\"}"
```

### Atenção importante sobre o Swagger

Se você usar o Swagger para chamar `/sync` com:

```json
{
  "dryRun": true
}
```

a execução será de **simulação**, sem persistência.

Para gravar de verdade no banco:

- use `dryRun: false`
- ou simplesmente não envie esse campo

---

## 9. Como testar a API depois da sync

### Listar transações

```bash
curl "http://localhost:3000/transactions?page=1&limit=20"
```

### Detalhe da transação

```bash
curl http://localhost:3000/transactions/1
```

### Parcelas da transação

```bash
curl http://localhost:3000/transactions/1/installments
```

### Detalhe da parcela pela rota alias

```bash
curl http://localhost:3000/installments/1
```

### Detalhe da parcela pela rota composta

```bash
curl http://localhost:3000/transactions/1/installments/1
```

### Pagador da transação

```bash
curl http://localhost:3000/transactions/1/payer
```

---

## 10. Como rodar os testes automatizados

### Ordem correta para validar localmente no host

Se você clonou o repositório e quer validar localmente fora do Docker, a ordem correta é:

```bash
npm install
npm run build
npm run lint
npm test
```

Esse passo é importante porque `build`, `lint` e `test` dependem das dependências locais instaladas em `node_modules`.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Testes

```bash
npm test
```

### Observação importante

No Docker Compose, os containers executam `npm install` internamente antes de subir a aplicação e o mock server.

Mas, no host local, esse passo **não acontece automaticamente**.

Por isso, se você clonar o repositório e tentar rodar `npm run build` sem antes executar `npm install`, o comando vai falhar porque o `tsc` ainda não estará disponível no ambiente local.

---

## 11. Como derrubar o ambiente

```bash
docker compose down
```

Se quiser derrubar e apagar também o volume do banco:

```bash
docker compose down -v
```

---

## 12. Principais variáveis de ambiente

Arquivos de referência:

- `.env.example` — base para execução local fora do Docker
- `.env.mock.example` — referência para cenário Docker/mock
- `.env.real.example` — referência para cenário com PSP real

Observação importante:

- para subir com Docker Compose, o projeto já possui defaults seguros de demo;
- para execução local fora do Docker, copie `.env.example` para `.env`;
- não versionar `.env` real com credenciais próprias.

### Aplicação

- `APP_NAME`
- `NODE_ENV`
- `HOST`
- `PORT`
- `LOG_LEVEL`
- `DOCS_ENABLED`

### Banco

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_CONNECTION_TIMEOUT_MS`
- `DATABASE_POOL_MIN`
- `DATABASE_POOL_MAX`
- `DATABASE_ENCRYPT`
- `DATABASE_TRUST_SERVER_CERTIFICATE`

### PSP

- `PSP_USE_MOCK_SERVER`
- `PSP_TIMEOUT_MS`
- `PSP_RETRY_ATTEMPTS`
- `PAGARME_BASE_URL`
- `PAGARME_API_KEY`
- `MERCADOPAGO_BASE_URL`
- `MERCADOPAGO_ACCESS_TOKEN`

Os valores presentes nos arquivos `*.example` são apenas exemplos seguros de demo ou placeholders.
Eles não representam credenciais reais de produção.

### Sync

- `SYNC_PAGE_SIZE`
- `SYNC_MAX_PAGE_SIZE`
- `SYNC_INCREMENTAL_WINDOW_MINUTES`
- `SYNC_SAFETY_OVERLAP_MINUTES`

### Segurança

- `SECURITY_HASH_SALT`
- `SECURITY_MASK_SENSITIVE_DATA`
- `SECURITY_REDACT_SECRETS_IN_LOGS`

### Observabilidade

- `OBS_STRUCTURED_LOGGING`
- `OBS_METRICS_ENABLED`
- `OBS_REQUEST_CORRELATION_ENABLED`

---

## 13. Decisões arquiteturais principais

### Monólito modular

A solução foi mantida como monólito modular para evitar complexidade artificial e manter execução local previsível.

### SQL Server real

A persistência usa SQL Server real, não fake em memória.

### Mock server integrado

O mock server foi integrado ao Docker Compose para permitir validação sem depender de credenciais reais dos PSPs.

### Sync acionável

A sincronização pode ser executada por:

- endpoint HTTP
- CLI

### API de consulta separada do fluxo de integração

Os adapters PSP tratam integração externa; a API consulta o estado persistido.

### Segurança do pagador

O `document` do pagador não é exposto em texto puro na API.

### Health e readiness separados

- `/health` = liveness
- `/ready` = prontidão real com banco acessível

---

## 14. Bônus e diferenciais implementados

### Entregues e defensáveis

- **Swagger/OpenAPI em `/docs`**
- **logs estruturados**
- **requestId / correlação**
- **health e readiness**
- **mock server local integrado**
- **idempotência de reimportação validada no fluxo principal**
- **observabilidade operacional mínima**
- **resiliência básica por configuração de retry/circuit breaker nas integrações**

### Implementado com cuidado de escopo

- **outbox / inbox**: estruturas e scripts existem no projeto, mas isso só deve ser vendido como fluxo ativo se estiver realmente operando no fluxo final demonstrado
- **cache**: existe estrutura/configuração no projeto, mas só deve ser defendido como bônus entregue se estiver efetivamente ativo no fluxo validado

A regra aqui é simples:
não vender como “feito” o que só existe como preparação estrutural.

---

## 15. Onde encontrar a documentação complementar

### Backlog e planejamento

- `docs/backlog`

### Arquitetura

- `docs/architecture`

Arquivos mais relevantes:

- `docs/architecture/overview.md`
- `docs/architecture/modules.md`
- `docs/architecture/docker-compose-environment.md`
- `docs/architecture/swagger-openapi.md`
- `docs/architecture/transaction-installments-endpoint.md`

### Testes e validação guiada

- `docs/testing.md`

### Checklist final de aderência ao edital

- `docs/checklist.md`

### Roteiro da demonstração

- `docs/demo.md`

### Consultas e evidências no banco

- `docs/database-query-guide.md`

---

## 16. Como apresentar a solução

Se a intenção for mostrar a aplicação para avaliação técnica, siga este material:

- `docs/demo.md`

Esse arquivo organiza a ordem da apresentação com:

- comandos;
- resultados esperados;
- o que cada etapa prova;
- contingência mínima.

---

## 17. Checklist final de entrega

Antes de enviar, consulte obrigatoriamente:

- `docs/checklist.md`

Esse arquivo consolida:

- obrigatórios do edital;
- diferenciais implementados;
- evidências;
- status objetivo;
- riscos residuais.

---

## 18. Observação final

Este README foi escrito para permitir que alguém avalie a solução sem depender de explicação oral.

Se algo precisar ser defendido na entrega, a ordem correta é:

1. usar o `README.md` para subir e operar;
2. usar `docs/architecture` para sustentar decisões técnicas;
3. usar `docs/checklist.md` para validar aderência final ao edital;
4. usar `docs/demo.md` para conduzir a demonstração.
