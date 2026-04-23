# Swagger / OpenAPI

## Objetivo

Publicar documentação navegável da API em:

- `GET /docs`

O objetivo aqui não é enfeite.
É permitir que avaliador e desenvolvedor consigam:

- entender o contrato;
- visualizar parâmetros;
- ver respostas esperadas;
- testar manualmente a API com menos atrito.

## Escopo documentado

A documentação cobre os endpoints de consulta mais importantes da aplicação:

- `GET /transactions`
- `GET /transactions/:id`
- `GET /transactions/:id/installments`
- `GET /installments/:id`
- `GET /transactions/:transactionId/payer`

Também existe documentação de health e dos endpoints de sync, mas o foco da US foi a camada principal de consulta.

## Estratégia adotada

A aplicação usa:

- `@fastify/swagger`
- `@fastify/swagger-ui`

A publicação da UI acontece no próprio servidor Fastify.

## Ponto de registro

O registro do Swagger fica na camada de servidor:

- `src/app/server/docs/registerSwagger.ts`

Essa escolha mantém a documentação como parte do bootstrap HTTP real da aplicação.

## Decisão importante

O Swagger não foi tratado como documento separado do sistema.

Ele foi acoplado ao servidor real da aplicação para reduzir drift entre:

- implementação;
- schema;
- contrato exibido em `/docs`.

## Schemas compartilhados

Os schemas OpenAPI reutilizáveis foram concentrados em:

- `src/app/server/docs/openapi.schemas.ts`

Esse arquivo centraliza estruturas comuns como:

- erro padrão;
- listagem paginada de transações;
- detalhe de transação;
- pagador;
- parcelas.

## Relação entre validação e documentação

Existe um ponto importante aqui:

- os schemas das rotas continuam sendo usados para validação no Fastify;
- o Swagger reaproveita esses contratos;
- mas a documentação só pode refletir o que a API realmente devolve.

Isso evita o erro clássico de documentar tipo bonito e resposta real diferente.

## Contrato documentado com o tipo real

A API hoje devolve vários campos numéricos serializados como string na resposta HTTP.

Exemplos:

- `id`
- `amount`
- `fees`
- `originalAmount`
- `netAmount`

O Swagger foi alinhado a esse comportamento real.

Documentar como `number` seria mais bonito, mas seria mentira.

## Segurança do contrato

O Swagger não documenta exposição insegura de dados sensíveis.

Em especial:

- `document` do pagador não aparece em texto puro;
- o pagador expõe apenas campos seguros;
- o contrato de erro não expõe stack trace.

## Sync no Swagger

Os endpoints de sync também podem aparecer no `/docs`.

Mas existe uma pegadinha operacional importante:

- `dryRun: true` executa leitura sem persistência;
- para popular banco de verdade, o teste deve usar `dryRun: false` ou omitir esse campo.

Isso precisa estar claro para não induzir interpretação errada de que a sync “falhou”.

## Ambiente local

A documentação Swagger é acessível no ambiente local real da aplicação:

```text
http://localhost:3000/docs
```

No fluxo com Docker Compose, isso permite:

1. subir ambiente;
2. validar `/health`;
3. abrir `/docs`;
4. disparar sync;
5. consultar os endpoints.

## Benefícios da publicação em `/docs`

A publicação do Swagger trouxe ganho prático em:

- navegação do contrato;
- validação manual;
- demonstração técnica;
- redução de ambiguidade para o avaliador.

## Limites

O Swagger desta solução não tenta ser:

- portal externo de desenvolvedor;
- gerador de SDK;
- documentação exaustiva de tudo que existe internamente.

Ele existe para documentar bem o que o avaliador realmente precisa usar e verificar.

## Resultado esperado

Quando a implementação está correta, o Swagger em `/docs` deve:

- abrir sem erro;
- mostrar os endpoints principais;
- refletir o contrato real da API;
- permitir validação manual com baixa fricção.

Se ele divergir da API, a documentação está errada, mesmo que esteja bonita.
