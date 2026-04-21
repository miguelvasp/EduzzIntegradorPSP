# Mock Server Environment Integration

## Objetivo

Integrar o mock server ao ambiente local e aos fluxos de teste sem alterar código de domínio.

## Princípio

A troca entre PSP real e mock ocorre apenas por configuração.

Não deve existir lógica de domínio do tipo:

- se mock então...
- se real então...

## Variáveis de ambiente

### Modo mock

- `PSP_USE_MOCK_SERVER=true`
- `PAGARME_BASE_URL=http://mock-server:3334/core/v5`
- `MERCADOPAGO_BASE_URL=http://mock-server:3334/v1`

### Modo real

- `PSP_USE_MOCK_SERVER=false`
- `PAGARME_BASE_URL=https://api.pagar.me/core/v5`
- `MERCADOPAGO_BASE_URL=https://api.mercadopago.com/v1`

## Docker Compose

O ambiente local sobe junto:

- aplicação principal
- banco de dados
- mock server

## Fluxo operacional

### Subir ambiente com mock

```bash
docker compose up -d db mock-server app
```
