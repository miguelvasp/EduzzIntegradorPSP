# Guia de Testes

Este arquivo existe para ser um passo a passo operacional simples.

Se você quiser testar a aplicação sem pensar muito, siga exatamente esta ordem.

---

## 1. Antes de começar

Você precisa ter:

- Docker Desktop instalado;
- Docker Desktop aberto;
- terminal aberto na pasta do projeto.

Exemplo:

```bash
cd D:\Projetos\EduzzIntegradorPSP
```

---

## 2. Limpar ambiente antigo

Se já houve execução anterior, limpe tudo:

```bash
docker compose down -v
```

Isso evita testar estado velho do banco.

---

## 3. Subir o ambiente

```bash
docker compose up --build
```

Espere os serviços subirem.

Os serviços esperados são:

- `db`
- `db-bootstrap`
- `mock-server`
- `app`

---

## 4. Validar se a aplicação está viva

Abra outro terminal e rode:

```bash
curl http://localhost:3000/health
```

Resultado esperado:

```json
{"status":"ok"}
```

---

## 5. Validar se a aplicação está pronta

```bash
curl http://localhost:3000/ready
```

Resultado esperado:

```json
{"status":"ready","checks":{"app":"ok","database":"ok"}}
```

---

## 6. Abrir o Swagger

No navegador:

```text
http://localhost:3000/docs
```

Verifique se os endpoints principais aparecem.

---

## 7. Rodar sincronização

### Pagar.me

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{\"psp\":\"pagarme\"}"
```

### Mercado Pago

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{\"psp\":\"mercadopago\"}"
```

---

## 8. Consultar as transações

```bash
curl "http://localhost:3000/transactions?page=1&limit=20"
```

Se a sync tiver funcionado, o retorno não deve vir vazio.

---

## 9. Testar endpoints de detalhe

```bash
curl http://localhost:3000/transactions/1
curl http://localhost:3000/transactions/1/installments
curl http://localhost:3000/installments/1
curl http://localhost:3000/transactions/1/payer
```

Se o `id` 1 não existir, use um id real retornado na listagem.

---

## 10. Testar reimportação sem duplicidade

Rode a sync do mesmo PSP de novo:

```bash
curl -X POST http://localhost:3000/sync -H "Content-Type: application/json" -d "{\"psp\":\"pagarme\"}"
```

Depois consulte novamente:

```bash
curl "http://localhost:3000/transactions?page=1&limit=100"
```

O total não deve crescer indevidamente com os mesmos `externalId`.

---

## 11. Testar readiness real

Com o ambiente de pé:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Depois pare o banco:

```bash
docker compose stop db
```

Teste de novo:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Comportamento esperado:

- `/health` continua respondendo;
- `/ready` passa a retornar `not_ready`.

Depois suba o banco de novo:

```bash
docker compose start db
```

---

## 12. Rodar testes automatizados

```bash
npm install
npm test
```

Também é recomendado validar:

```bash
npm run build
npm run lint
```

---

## 13. Ver logs se algo der errado

### Logs da aplicação

```bash
docker compose logs app --tail=200
```

### Logs do banco

```bash
docker compose logs db --tail=200
```

### Logs do bootstrap do banco

```bash
docker compose logs db-bootstrap --tail=200
```

### Logs do mock-server

```bash
docker compose logs mock-server --tail=200
```

---

## 14. Derrubar o ambiente

```bash
docker compose down
```

Se quiser apagar o volume do banco:

```bash
docker compose down -v
```

---

## 15. Ordem mínima recomendada para validar tudo

1. subir ambiente;
2. validar `/health`;
3. validar `/ready`;
4. abrir `/docs`;
5. executar sync de Pagar.me;
6. executar sync de Mercado Pago;
7. consultar `/transactions`;
8. testar detalhe;
9. testar reimportação;
10. testar readiness com banco fora;
11. rodar testes automatizados.
