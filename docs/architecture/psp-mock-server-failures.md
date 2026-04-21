# PSP Mock Server Failures

## Objetivo

Permitir testes reproduzíveis de resiliência e parsing defensivo contra falhas técnicas dos PSPs.

## Estratégia de ativação

A ativação ocorre por query param:

- `scenario=failure`
- `failureMode=http_500|timeout|invalid_payload`

Exemplos:

### Pagar.me

- `/core/v5/orders?scenario=failure&failureMode=http_500`
- `/core/v5/orders?scenario=failure&failureMode=timeout`
- `/core/v5/orders?scenario=failure&failureMode=invalid_payload`

### Mercado Pago

- `/v1/payments/search?scenario=failure&failureMode=http_500`
- `/v1/payments/search?scenario=failure&failureMode=timeout`
- `/v1/payments/search?scenario=failure&failureMode=invalid_payload`

## Modos suportados

### http_500

Retorna:

- status `500`
- payload mínimo de erro

Uso:

- validar retry
- validar logging
- validar tratamento de erro externo

### timeout

Atraso controlado de resposta.

Uso:

- validar timeout do cliente
- validar retry por timeout
- validar observabilidade

### invalid_payload

Retorna `200`, porém com estrutura incompatível com o contrato esperado.

Uso:

- validar parsing defensivo
- validar rejeição segura
- validar robustez do adapter

## Princípios

- falha ativada explicitamente
- sem aleatoriedade
- sem caos randômico
- sem quebrar o próprio mock server
- determinismo para teste

## Observabilidade mínima

Toda falha simulada gera log contendo:

- rota
- cenário
- tipo de falha
- status
- marcação de falha simulada
