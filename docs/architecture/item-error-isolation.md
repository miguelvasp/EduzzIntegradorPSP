# Item Error Isolation

## Objetivo

Garantir que falhas localizadas em uma transação não interrompam indevidamente o processamento dos demais itens da sincronização.

## Unidade mínima de isolamento

O item é a unidade mínima de isolamento operacional.

Cada item processado deve produzir resultado individual e observável.

## Resultado possível por item

A base atual suporta:

- `processed_successfully`
- `rejected`
- `conflicted`
- `failed`

## Componentes

### ItemProcessingExecutor

Responsável por executar o processamento do item com isolamento de falha.

Se a ação concluir, o item sai como sucesso.

Se a ação falhar, a exceção é capturada e encaminhada ao `ItemFailureHandler`.

### ItemFailureHandler

Responsável por traduzir a falha do item para resultado operacional consistente.

Mapeamento atual:

- `ValidationError` -> `rejected`
- `DomainError` -> `conflicted`
- `IntegrationError` -> `failed`
- `InternalError` ou erro genérico -> `failed`

A política padrão é continuar a execução quando a falha for localizada no item.

### SyncExecutionSummary

Responsável por consolidar contadores da execução:

- itens lidos
- itens com sucesso
- itens rejeitados
- itens conflitados
- itens com falha
- falhas globais

## Regra importante

Falha de item não é falha global por definição.

A execução só deve ser interrompida quando houver condição estrutural impeditiva para o fluxo como um todo.

## Integração com o fluxo

A ordem esperada é:

1. item é lido
2. item é processado pelo executor
3. falha localizada é classificada
4. resultado do item é registrado
5. próximo item continua sendo processado

## Benefício

Com essa base, a sincronização evita abortar por:

- erro de validação em item isolado
- conflito de dados em item específico
- erro técnico restrito a uma transação
- falha inesperada localizada
