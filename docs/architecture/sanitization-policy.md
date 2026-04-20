# Sanitization Policy

## Objetivo

Este documento descreve a política técnica de sanitização e redaction da aplicação.

O objetivo é definir como dados sensíveis devem ser tratados antes de:

- persistência em tabelas de evidência;
- registro em logs;
- serialização em erros;
- uso em testes e exemplos;
- exposição por interfaces externas.

A US-009 exige serviço central de hash, componente de sanitização de payload, componente de redaction de segredos e política central de tratamento de campos sensíveis. :contentReference[oaicite:3]{index=3}

## Componentes centrais

### `DocumentHashService`

Responsável por gerar hash consistente do documento do pagador.

Responsabilidades:

- normalizar o valor recebido;
- remover caracteres não numéricos;
- garantir consistência entre entradas equivalentes com e sem máscara;
- gerar hash SHA-256;
- permitir uso opcional de salt;
- impedir estratégias dispersas de hashing no projeto.

Uso esperado:

- ingestão;
- persistência de pagadores;
- persistência de snapshots do pagador;
- consultas por hash quando necessário.

### `PayloadSanitizer`

Responsável por sanitizar payloads de integração antes de persistência e uso operacional.

Responsabilidades:

- identificar campos sensíveis no payload;
- remover ou mascarar documento em texto puro;
- preservar a estrutura útil do objeto;
- delegar redaction de segredos e dados pessoais ao redactor central.

Uso esperado:

- antes de persistir em `psp_raw_payloads`;
- antes de registrar payload em erro;
- antes de usar payload em suporte operacional persistido.

### `SecretRedactor`

Responsável por redigir segredos e dados sensíveis em objetos operacionais.

Responsabilidades:

- mascarar tokens, authorization, api keys, passwords e segredos equivalentes;
- mascarar e-mail quando aplicável;
- atuar recursivamente em objetos e arrays;
- proteger logs e erros de exposição indevida.

Uso esperado:

- logs estruturados;
- objetos de erro;
- payloads já processados pela sanitização;
- saídas operacionais internas.

### Política central em `sensitiveData.ts`

Responsável por classificar quais chaves exigem tratamento especial.

Responsabilidades:

- definir quais chaves representam documento;
- definir quais chaves representam segredo;
- definir quais chaves representam dado pessoal;
- permitir comparação case-insensitive;
- evitar classificação dispersa em múltiplos módulos.

## Diferença entre hash, sanitização e redaction

### Hash

Hash é usado quando o sistema precisa manter uma representação estável e segura do dado para persistência ou comparação.

Exemplo de uso:

- documento do pagador em `payers`
- documento do pagador em `transaction_payer_snapshots`

Objetivo:

- não preservar o valor original em texto puro;
- permitir consistência entre entradas equivalentes.

### Sanitização

Sanitização é usada quando o sistema precisa manter um payload ou objeto útil para auditoria, mas sem conteúdo sensível bruto.

Exemplo de uso:

- payloads persistidos em `psp_raw_payloads`

Objetivo:

- preservar estrutura;
- remover ou mascarar conteúdo sensível;
- manter utilidade para diagnóstico.

### Redaction

Redaction é usada para mascarar conteúdo sensível em logs, erros e saídas operacionais.

Exemplo de uso:

- headers com token;
- mensagens operacionais;
- objetos de log;
- erros estruturados.

Objetivo:

- impedir vazamento em superfícies de observabilidade e suporte.

## Política de sanitização de payload

Antes de persistir payload de integração como evidência, a aplicação deve:

1. identificar campos sensíveis;
2. remover ou mascarar documento em texto puro;
3. redigir segredos e credenciais;
4. mascarar dados pessoais quando aplicável;
5. preservar o restante da estrutura útil do payload.

Regras mínimas:

- documento deve ser substituído por representação segura;
- token, authorization, password e segredos equivalentes devem ser redigidos;
- e-mail deve ser mascarado em contexto operacional;
- o payload resultante deve permanecer válido como JSON.

## Política de logs e erros

Antes de registrar logs ou erros estruturados, a aplicação deve:

- aplicar redaction em segredos;
- evitar serialização de objetos integrais não sanitizados;
- impedir documento em texto puro;
- impedir payload bruto em erro sem sanitização prévia;
- impedir connection string completa em logs.

Regras mínimas:

- logs consomem apenas objetos já saneados ou redigidos;
- respostas externas de erro não expõem detalhes sensíveis;
- erros internos podem ser armazenados apenas após tratamento seguro.

## Política para documento do pagador

O documento do pagador segue três regras obrigatórias:

1. **persistência funcional**  
   usar hash por meio do `DocumentHashService`

2. **payload de auditoria**  
   nunca armazenar em texto puro; aplicar sanitização

3. **saída externa**  
   nunca retornar em texto puro; expor apenas `documentType` e indicador de presença quando aplicável

## Política para testes e exemplos

Fixtures, mocks, snapshots e exemplos devem:

- usar documentos fictícios;
- não conter segredos reais;
- não conter payload bruto sensível não sanitizado;
- respeitar a mesma política de proteção da aplicação.

## Política para documentação

A documentação técnica e operacional deve:

- usar placeholders para segredos;
- usar exemplos mascarados;
- evitar documento real de pagador;
- não reproduzir payload sensível em texto puro.

## Fluxo esperado de uso

### Documento do pagador
1. dado bruto entra
2. valor é normalizado
3. hash é gerado
4. somente hash segue para persistência funcional

### Payload de PSP
1. payload bruto entra
2. `PayloadSanitizer` sanitiza campos sensíveis
3. `SecretRedactor` mascara segredos e dados pessoais aplicáveis
4. payload sanitizado pode ser persistido como evidência

### Log ou erro
1. objeto operacional é preparado
2. `SecretRedactor` aplica redaction
3. somente objeto tratado segue para log ou persistência operacional

## Resultado esperado

Com essa política aplicada, a base fica preparada para:

- persistir documento apenas em hash;
- armazenar payload de auditoria sem documento puro;
- impedir exposição de segredo em logs e erros;
- sustentar auditoria e troubleshooting sem comprometer segurança;
- reduzir regressão futura por centralização da regra.