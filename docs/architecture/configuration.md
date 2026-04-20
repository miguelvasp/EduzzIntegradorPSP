# Configuration

## Objetivo

Centralizar a configuracao da aplicacao em uma unica camada tipada, validada no bootstrap e consumida pelo restante do sistema sem acesso direto a `process.env`.

## Principios adotados

- Uma unica origem de leitura de ambiente em `src/app/config/env.ts`
- Validacao tipada e defaults controlados antes de expor a configuracao
- Separacao entre dados publicos, operacionais e sensiveis dentro dos grupos de configuracao
- Falha explicita no bootstrap quando a configuracao minima for invalida
- Estrutura preparada para crescer sem espalhar regras pelo codigo

## Politica de uso

- `src/app/config/validation.ts` declara os schemas Zod, normaliza primitivos e valida integridade minima
- `src/app/config/configuration.ts` define os contratos tipados e monta o objeto final
- `src/app/config/env.ts` carrega `dotenv/config`, le `process.env` uma unica vez e exporta a configuracao consolidada
- Modulos da aplicacao devem consumir o objeto central de configuracao, nunca `process.env`

## Politica de segredos

- Segredos permanecem no objeto central para manter contrato unico, mas nao recebem valores reais no repositorio
- `DATABASE_PASSWORD`, `PAGARME_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN` e `SECURITY_HASH_SALT` sao opcionais nesta fase
- Logs e mascaramento devem respeitar `SECURITY_MASK_SENSITIVE_DATA` e `SECURITY_REDACT_SECRETS_IN_LOGS`
- `.env.example` deve expor apenas placeholders seguros ou vazios

## Grupos de configuracao

| Grupo | Conteudo principal | Classificacao predominante |
| --- | --- | --- |
| `app` | nome, ambiente, host, porta, log e flags derivadas | publica |
| `database` | conexao, pool e senha opcional | operacional com campo sensivel |
| `psp` | mock, timeout, retry, URLs e credenciais opcionais | operacional com campos sensiveis |
| `sync` | limites e janelas de sincronizacao | operacional |
| `security` | mascaramento, redacao e salt opcional | sensivel e operacional |
| `observability` | logging estruturado, metricas e correlacao | operacional |
| `cache` | habilitacao e TTL | operacional |
| `outbox` | dispatcher, lote, polling e retry | operacional |

## Defaults controlados

- Valores basicos de aplicacao e banco possuem defaults seguros para DX local
- Credenciais externas permanecem opcionais para permitir subida local sem PSP real
- `DOCS_ENABLED` assume `true` em `development` e `false` nos demais ambientes quando nao informado
- Regras relacionais sao validadas antes da inicializacao, como `DATABASE_POOL_MAX >= DATABASE_POOL_MIN` e `SYNC_MAX_PAGE_SIZE >= SYNC_PAGE_SIZE`

## Evolucao da configuracao

1. Declarar a nova variavel no schema de `validation.ts`
2. Definir default ou obrigatoriedade de forma explicita
3. Mapear o valor no contrato final em `configuration.ts`
4. Atualizar `.env.example`, `README.md` e este documento
5. Manter a regra de nao acessar `process.env` fora de `env.ts`
