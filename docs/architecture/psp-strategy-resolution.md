# PSP Strategy Resolution

## Objetivo

Resolver dinamicamente a integração correta por PSP sem espalhar condicionais pelo fluxo central.

## Abordagem

A aplicação usa:

- `Strategy` para encapsular o comportamento específico de cada PSP
- `Factory` para resolver a strategy correta a partir do `PspType`

## Contrato base

`PspSyncStrategy` define a interface comum para o fluxo consumidor:

- `getPsp()`
- `listPage(...)`
- `getById(...)`
- `adapt(...)`

Com isso, a sincronização futura depende de uma abstração estável, não do cliente ou adapter concreto de cada PSP.

## Strategies implementadas

### PagarmeSyncStrategy

Responsável por:

- usar `PagarmeHttpClient`
- usar `PagarmeTransactionAdapter`
- trabalhar com paginação `page` e `size`

### MercadoPagoSyncStrategy

Responsável por:

- usar `MercadoPagoHttpClient`
- usar `MercadoPagoTransactionAdapter`
- trabalhar com paginação `offset` e `limit`

## Factory

`PspStrategyFactory` recebe as strategies disponíveis e resolve a implementação correta por `PspType`.

Responsabilidade da factory:

- mapear PSP para strategy
- devolver a strategy correta
- falhar de forma controlada quando o PSP não estiver suportado

A factory não concentra lógica de integração, paginação ou adaptação.

## Benefício para a sincronização

Com essa base, a sincronização futura pode:

- receber um PSP alvo
- resolver a strategy pela factory
- listar registros sem conhecer o contrato externo
- buscar detalhe por id sem conhecer o endpoint real
- adaptar o payload sem conhecer regras específicas do PSP

## Regra importante

A camada central não deve ter `if` por PSP para:

- escolher cliente
- escolher adapter
- decidir tipo de paginação
- decidir qual integração chamar

Essas diferenças ficam encapsuladas nas strategies.
