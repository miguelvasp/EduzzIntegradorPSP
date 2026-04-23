# Roteiro da demonstração — US51

## Objetivo

Este documento existe para conduzir a demonstração da solução com começo, meio e fim, sem improviso desnecessário.

A lógica é simples:

- mostrar que o ambiente sobe;
- mostrar que a aplicação está viva e pronta;
- mostrar que a sincronização funciona;
- mostrar que a API consulta dado real;
- mostrar segurança do dado sensível;
- mostrar ausência de duplicidade;
- mostrar documentação e evidências finais.

---

## Ordem recomendada da demo

1. Subida do ambiente
2. Health e readiness
3. README e Swagger
4. Sincronização
5. Consulta da API
6. Segurança e idempotência
7. Qualidade e fechamento

---

## 1. Subida do ambiente

### Objetivo

Provar que a solução sobe localmente com Docker Compose sem ritual obscuro.

### Comando

```bash
docker compose up --build
```

### O que isso prova

- SQL Server sobe;
- bootstrap do banco executa;
- mock server sobe;
- app sobe.

### Evidência observável

- containers `db`, `db-bootstrap`, `mock-server` e `app`;
- porta `3000` respondendo;
- logs de startup da aplicação.

### Contingência

Se quiser partir de ambiente limpo:

```bash
docker compose down -v
docker compose up --build
```

---

## 2. Health e readiness

### Objetivo

Provar que a aplicação está viva e pronta para operar.

### Comandos

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

### Resultado esperado

#### Health

```json
{ "status": "ok" }
```

#### Ready

```json
{
  "status": "ready",
  "checks": {
    "app": "ok",
    "database": "ok"
  }
}
```

### O que isso prova

- `/health` mostra liveness;
- `/ready` mostra prontidão real;
- banco está acessível.

### Evidência observável

Resposta HTTP e, se necessário, logs da aplicação.

### Contingência

Se quiser provar diferença real entre os dois:

1. parar o banco;
2. testar `/health`;
3. testar `/ready`.

Exemplo:

```bash
docker compose stop db
curl http://localhost:3000/health
curl http://localhost:3000/ready
docker compose start db
```

---

## 3. README e Swagger

### Objetivo

Provar que a solução está documentada e navegável.

### Ações

- abrir `README.md`
- abrir `http://localhost:3000/docs`

### O que mostrar

No README:

- como subir;
- como validar;
- como sincronizar;
- como testar;
- onde estão backlog e arquitetura.

No Swagger:

- `GET /transactions`
- `GET /transactions/:id`
- `GET /transactions/:id/installments`
- `GET /installments/:id`
- `GET /transactions/:transactionId/payer`

### O que isso prova

- documentação operacional existe;
- contrato HTTP está navegável;
- a API está pronta para validação manual.

### Contingência

Se o Swagger estiver aberto mas o banco estiver vazio, rode a sync antes de demonstrar os `GETs`.

---

## 4. Sincronização

### Objetivo

Provar que a sincronização funciona e persiste dado real.

### Comandos

#### Pagar.me

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{"psp":"pagarme"}"
```

#### Mercado Pago

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{"psp":"mercadopago"}"
```

### Resultado esperado

Resposta com resumo da execução, por exemplo:

- `status: completed`
- `pagesProcessed`
- `itemsRead`

### O que isso prova

- sync acionável;
- integração com mock server;
- processamento real;
- persistência posterior observável.

### Evidência observável

Resposta do endpoint e, se necessário, log resumido da execução.

### Contingência

No Swagger, não usar `dryRun: true` se a intenção for persistir.
Se quiser evitar erro, use body mínimo:

```json
{
  "psp": "pagarme"
}
```

---

## 5. Consulta da API

### Objetivo

Provar que a API lê estado persistido real.

### Comandos

#### Listagem

```bash
curl "http://localhost:3000/transactions?page=1&limit=20"
```

#### Detalhe da transação

```bash
curl http://localhost:3000/transactions/1
```

#### Parcelas da transação

```bash
curl http://localhost:3000/transactions/1/installments
```

#### Detalhe da parcela pela rota alias

```bash
curl http://localhost:3000/installments/1
```

#### Pagador da transação

```bash
curl http://localhost:3000/transactions/1/payer
```

### O que isso prova

- consulta real ao banco;
- endpoints obrigatórios funcionando;
- rota alias de parcela funcionando;
- política segura do pagador aplicada.

### Evidência observável

Respostas JSON com dados persistidos após a sync.

### Contingência

Se `id=1` não existir no momento da demo, primeiro rode:

```bash
curl "http://localhost:3000/transactions?page=1&limit=20"
```

e pegue um id real da lista.

---

## 6. Segurança e idempotência

### Objetivo

Provar que dado sensível não vaza e que a reimportação não duplica transações.

### Segurança do pagador

Mostrar que a resposta do pagador contém:

- `documentType`
- `hasDocument`

e não contém:

- CPF/CNPJ em texto puro

### Idempotência

#### Comando

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{"psp":"pagarme"}"
curl "http://localhost:3000/transactions?page=1&limit=100"
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{"psp":"pagarme"}"
curl "http://localhost:3000/transactions?page=1&limit=100"
```

### Resultado esperado

- a sync executa;
- o total de transações não cresce indevidamente;
- não aparecem `externalId` duplicados na listagem.

### O que isso prova

- proteção contra duplicidade;
- reimportação segura no fluxo principal.

### Contingência

Se quiser encurtar a demo, faça a idempotência com apenas um PSP.

---

## 7. Qualidade e fechamento

### Objetivo

Fechar a demonstração mostrando disciplina técnica, não só endpoint.

### Ações

- mostrar comando de testes:

```bash
npm test
```

- mostrar checklist final:
  - `docs/checklist.md`

- mostrar documentação de arquitetura:
  - `docs/architecture`

### O que isso prova

- a solução não depende só de código;
- existe documentação;
- existe checklist de aderência;
- existe organização para revisão final.

### Contingência

Se não quiser rodar toda a suíte durante a demo, mostre:

- comando;
- estrutura de testes;
- checklist final;
- e deixe claro o que já foi validado na execução manual.

---

## 8. Sequência curta de demonstração

Se precisar fazer uma demo enxuta, siga esta ordem:

1. `docker compose up --build`
2. `curl /health`
3. `curl /ready`
4. abrir `/docs`
5. rodar `POST /sync`
6. rodar `GET /transactions`
7. rodar `GET /transactions/1/payer`
8. repetir sync para provar idempotência
9. mostrar `docs/checklist.md`

---

## 9. Evidências principais por critério

| Critério               | Evidência principal                |
| ---------------------- | ---------------------------------- |
| Ambiente sobe          | `docker compose up --build`        |
| Liveness               | `GET /health`                      |
| Readiness              | `GET /ready`                       |
| Swagger                | `GET /docs`                        |
| Sync acionável         | `POST /sync`                       |
| Persistência real      | `GET /transactions` após sync      |
| Endpoints obrigatórios | chamadas de consulta               |
| Segurança do pagador   | `GET /transactions/:id/payer`      |
| Idempotência           | reexecução da sync sem duplicidade |
| Governança final       | `docs/checklist.md`                |

---

## 10. Observação final

A pior demo é a que tenta mostrar tudo e se perde.

A melhor demo é a que mostra, em ordem certa, os pontos que realmente importam:

- sobe;
- está pronta;
- sincroniza;
- consulta;
- não vaza dado sensível;
- não duplica;
- está documentada.
