# Convenções de Desenvolvimento

## Objetivo

Estas convenções existem para garantir consistência estrutural, previsibilidade de implementação, facilidade de revisão e evolução segura do projeto.

## Convenções de diretórios

- diretórios sempre em minúsculo
- nomes de diretórios devem refletir responsabilidade real
- evitar agrupamento global por tipo técnico
- priorizar organização por capacidade de negócio

## Diretórios genéricos proibidos

Não utilizar, sem justificativa explícita:

- `services/` global
- `utils/` genérico
- `helpers/` sem escopo
- `common/` sem responsabilidade clara

Compartilhamento transversal real deve ficar restrito ao módulo `shared`.

## Convenções de arquivos

- nomes explícitos e descritivos
- evitar abreviações ambíguas
- manter padrão consistente por tipo de componente
- arquivos devem refletir responsabilidade específica

Exemplos de nomes aceitáveis:

- `createServer.ts`
- `transactionRepository.ts`
- `syncTransactionsUseCase.ts`
- `pagarmeTransactionAdapter.ts`

## Convenções de camadas por módulo

Quando aplicável, cada módulo deve seguir a estrutura:

```text
module/
  domain/
  application/
  infrastructure/
  presentation/
```
