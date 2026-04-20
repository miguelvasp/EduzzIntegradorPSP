# Data Protection

## Objetivo

Este documento define a política técnica de proteção de dados sensíveis da aplicação de agregação de transações multi-PSP.

O objetivo é garantir que dados protegidos não sejam expostos indevidamente em:

- persistência;
- logs;
- payloads de auditoria;
- respostas da API;
- erros e exceções;
- testes;
- documentação.

A política segue o princípio de mínima exposição necessária e complementa as decisões estruturais já adotadas no domínio, no banco de dados e na trilha de auditoria. :contentReference[oaicite:1]{index=1}

## Princípios adotados

A proteção de dados da aplicação segue os princípios abaixo:

- mínima exposição necessária;
- proteção por padrão;
- centralização do tratamento de dados sensíveis;
- ausência de persistência indevida de documento em texto puro;
- ausência de redaction disperso e inconsistente;
- distinção entre dado funcional e dado sensível;
- previsibilidade para auditoria, suporte e testes.

## Classificação mínima de dados sensíveis

### Documento do pagador

Devem ser tratados como dados sensíveis:

- CPF;
- CNPJ;
- qualquer representação textual equivalente do documento;
- variações com máscara ou sem máscara.

Regra obrigatória:

- documento do pagador não deve ser persistido em texto puro;
- documento do pagador não deve ser exposto em texto puro em resposta externa;
- documento do pagador deve ser transformado em hash quando necessário para persistência e consulta segura.

Essa regra decorre diretamente do escopo do desafio técnico. :contentReference[oaicite:2]{index=2}

### Segredos e credenciais

Devem ser tratados como dados sensíveis:

- tokens;
- access tokens;
- authorization headers;
- API keys;
- client secrets;
- passwords;
- connection strings com credenciais;
- segredos operacionais da aplicação.

Regra obrigatória:

- segredos não devem aparecer em logs;
- segredos não devem aparecer em payloads persistidos;
- segredos não devem aparecer em documentação, testes ou exemplos;
- segredos não devem ser commitados no repositório.

### Dados pessoais em payloads

Devem ser tratados com proteção especial quando aparecerem em payloads de integração:

- documento do pagador;
- e-mail;
- combinações que permitam reidentificação desnecessária;
- campos técnicos com conteúdo sensível desnecessário para auditoria.

Regra obrigatória:

- payloads usados como evidência devem ser sanitizados antes de persistência;
- o sistema deve preservar estrutura útil para auditoria sem manter conteúdo sensível indevido.

### Erros e exceções

Devem ser tratados como superfícies sensíveis:

- mensagens contendo payload bruto;
- stack traces com segredos;
- erros com credenciais;
- exceções com objetos completos de integração.

Regra obrigatória:

- erros devem ser registrados apenas após sanitização ou redaction;
- respostas externas não devem vazar detalhes internos sensíveis.

## Superfícies de risco

### Entrada

Superfícies de entrada com potencial sensível:

- payloads vindos dos PSPs;
- documento do pagador;
- credenciais configuradas por ambiente;
- erros externos retornados por integração.

### Persistência

Superfícies de persistência com risco de vazamento:

- `payers`
- `transaction_payer_snapshots`
- `psp_raw_payloads`
- tabelas de erros e rastreabilidade operacional

### Saída

Superfícies de saída com potencial de exposição:

- respostas da API;
- logs estruturados;
- erros serializados;
- documentação;
- testes, fixtures e mocks.

## Regras de proteção por tipo de dado

### Documento do pagador

Tratamento obrigatório:

- normalizar antes do uso;
- aplicar hash em fluxo de persistência funcional;
- nunca armazenar em texto puro nas tabelas transacionais;
- nunca retornar em texto puro na API;
- nunca persistir em texto puro em payloads de auditoria.

Exposição permitida:

- `documentType`
- indicador de presença, quando aplicável

Exposição proibida:

- CPF/CNPJ puro
- CPF/CNPJ mascarado como “quase seguro” em superfícies operacionais persistidas

### Segredos

Tratamento obrigatório:

- redaction completo em logs, erros e saídas operacionais;
- uso apenas via configuração centralizada;
- nunca documentar valor real.

Exposição permitida:

- placeholders;
- indicadores genéricos de presença.

Exposição proibida:

- tokens;
- api keys;
- senhas;
- connection strings completas com credenciais.

### E-mail em payloads e logs

Tratamento recomendado:

- mascarar em payloads persistidos de evidência quando não for estritamente necessário;
- mascarar em logs e saídas operacionais.

## Regras para persistência

A aplicação deve garantir:

- documento apenas em hash em estruturas funcionais do domínio e do banco;
- payload de integração sanitizado antes de persistência;
- erros persistidos sem credenciais nem conteúdo sensível bruto;
- trilha operacional útil sem comprometer proteção de dados.

## Regras para respostas da API

A aplicação deve garantir:

- ausência de documento em texto puro;
- ausência de payload bruto de integração;
- ausência de segredos;
- ausência de stack trace em erro 500;
- respostas compatíveis com exposição mínima necessária.

## Regras para logs e observabilidade

A aplicação deve garantir:

- redaction de segredos;
- ausência de documento em texto puro;
- ausência de payload bruto não sanitizado;
- ausência de connection string completa;
- uso de estruturas já tratadas por sanitização ou redaction.

## Regras para testes

A base de testes deve obedecer às seguintes regras:

- não usar dados reais sensíveis;
- usar documentos fictícios;
- não usar snapshots com payload não sanitizado;
- não inserir segredos reais em fixtures, mocks ou exemplos.

## Regras para documentação

A documentação do projeto deve:

- usar placeholders para segredos;
- não conter documento real;
- não conter credenciais reais;
- usar exemplos seguros e mascarados.

## Componentes centrais da proteção

A implementação da política se apoia nos seguintes componentes:

- `DocumentHashService`
- `PayloadSanitizer`
- `SecretRedactor`
- política central em `sensitiveData.ts`

Esses componentes existem para evitar lógica dispersa e inconsistente de proteção.

## Limites desta política

Esta política não implementa:

- criptografia avançada de todos os campos do banco;
- tokenização completa de identificadores;
- KMS/HSM externo;
- autenticação/autorização da API;
- classificação legal por jurisdição.

Ela define a base técnica necessária para o escopo do produto.