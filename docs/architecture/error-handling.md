# Error Handling

## Objetivo

Padronizar o tratamento de erros da aplicação para garantir:

- resposta consistente na API
- classificação previsível
- rastreabilidade por requestId
- integração com logging estruturado
- não exposição de dados sensíveis

## Categorias

### ValidationError

- uso: parâmetros inválidos, contrato inválido, entrada malformada
- status HTTP: 400
- code padrão: validation.error

### DomainError

- uso: regra de negócio violada
- status HTTP: 422
- code padrão: domain.error

### NotFoundError

- uso: recurso inexistente
- status HTTP: 404
- code padrão: not_found

### IntegrationError

- uso: falha de PSP ou serviço externo
- status HTTP: 500
- code padrão: integration.error

### InternalError

- uso: falha inesperada
- status HTTP: 500
- code padrão: infrastructure.error

## Regras

- controllers e handlers não devem montar resposta de erro manualmente
- erros classificados devem ser lançados a partir da camada apropriada
- erro inesperado deve virar InternalError
- stack trace não deve ser exposta na API
- CPF/CNPJ, token, segredo e payload sensível não devem aparecer em resposta nem em log

## Logging

Todo erro tratado deve registrar:

- requestId
- errorCode
- categoria
- método HTTP
- URL
- statusCode
- detalhes sanitizados
