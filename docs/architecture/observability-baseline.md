# Observability Baseline

## Objetivo

Este documento define a baseline de observabilidade da aplicação no estágio atual do projeto.

A baseline cobre:

- logs estruturados;
- requestId;
- correlationId;
- contexto mínimo obrigatório;
- integração com proteção de dados sensíveis;
- preparação para métricas futuras.

A US-010 não exige stack completa de APM, mas exige base observável suficiente para HTTP, sincronização, integração externa e troubleshooting técnico. :contentReference[oaicite:1]{index=1}

## Escopo atual

A baseline atual contempla:

- logger central estruturado;
- contexto assíncrono por requisição/operação;
- middleware HTTP com requestId e correlationId;
- logs de startup;
- logs HTTP de entrada, saída e falha;
- base para correlação futura em sync e integrações PSP;
- integração com redaction de segredos.

## O que é obrigatório observar

### Aplicação

A aplicação deve registrar:

- início da aplicação;
- sucesso de inicialização;
- falha de inicialização.

### HTTP

Cada requisição deve produzir, no mínimo:

- log de entrada;
- log de saída;
- log de falha;
- duração;
- requestId;
- correlationId.

### Sync

Cada execução de sincronização deve produzir, no mínimo:

- início;
- progresso;
- erro por item;
- conclusão;
- syncRunId;
- PSP;
- item/externalId quando aplicável.

### PSP

Cada integração externa deve produzir, no mínimo:

- request iniciado;
- response recebida;
- falha técnica;
- timeout;
- retry quando houver.

## Campos mínimos por evento

A baseline atual considera estes campos como prioritários:

- timestamp
- level
- service
- environment
- eventType
- message
- module
- component
- requestId
- correlationId

Campos adicionais entram quando aplicáveis:

- syncRunId
- psp
- externalId
- transactionId
- installmentId
- reconciliationCaseId
- status
- errorCode
- durationMs
- context

## Níveis de log

A aplicação deve suportar:

- debug
- info
- warn
- error

Uso esperado:

### debug

Eventos detalhados de diagnóstico local.

### info

Eventos normais de operação.

### warn

Situações anormais recuperáveis ou relevantes para atenção.

### error

Falhas efetivas de operação, processamento ou integração.

## Regras de proteção

A observabilidade deve respeitar a política de dados sensíveis.

Não pode aparecer em log:

- documento em texto puro;
- token;
- authorization header bruto;
- api key;
- password;
- payload bruto não sanitizado;
- connection string completa.

## Resultado esperado para troubleshooting

A baseline deve permitir responder:

- qual request gerou determinado erro;
- qual correlação liga múltiplos eventos internos;
- qual syncRun originou falhas ou rejeições;
- qual PSP estava em processamento;
- qual item/transação foi afetado;
- quanto tempo a operação levou.

## Limites desta baseline

Esta baseline ainda não implementa:

- dashboard;
- tracing distribuído completo;
- métricas detalhadas;
- alertas;
- coleta centralizada em produção;
- APM externo.

Ela prepara a base para essas evoluções futuras sem retrabalho estrutural relevante.
