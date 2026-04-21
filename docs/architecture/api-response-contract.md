# API Response Contract

## Objetivo

Padronizar o contrato HTTP dos endpoints de consulta da API.

A padronização cobre:

- resposta paginada
- resposta de recurso único
- resposta de erro

## Resposta paginada

Usada em endpoints de coleção, como:

- `GET /transactions`

Estrutura:

```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```
