# API Error Contract

## Estrutura padrão

```json
{
  "timestamp": "2026-04-20T18:00:00.000Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "code": "domain.error",
  "message": "Business rule violation",
  "requestId": "f2b9d17d-4d56-4ed8-a7c5-31f442d44f6a",
  "path": "/transactions/123",
  "details": {
    "field": "payer"
  }
}
```
