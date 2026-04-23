# Sync CLI

## Objetivo

Documentar de forma curta como disparar a sincronização real pela linha de comando.

## Ponto de entrada

A aplicação expõe a sincronização acionável pela CLI em:

- `src/app/cli/sync.cli.ts`

## Responsabilidades da CLI

A CLI é responsável por:

- interpretar argumentos;
- montar contexto de execução;
- acionar o use case real de sincronização;
- retornar código de saída previsível;
- registrar falha estrutural com log consistente.

## Regras

- a CLI não implementa um segundo pipeline;
- a CLI reutiliza o fluxo real da sincronização;
- a CLI depende da infraestrutura concreta já configurada;
- a CLI respeita a configuração ativa do ambiente.

## Saída

A execução retorna:

- `0` em caso de sucesso;
- `1` em caso de falha estrutural.

O resultado da execução também é observável pelos logs e pelo estado persistido no banco.

## Uso esperado

A CLI deve ser usada para:

- execução manual local;
- validação operacional;
- demonstração do fluxo;
- futura cobertura de integração.

## Observação

O objetivo aqui não é criar uma interface sofisticada.

O objetivo é garantir um meio explícito, simples e reproduzível de executar a sincronização real.
