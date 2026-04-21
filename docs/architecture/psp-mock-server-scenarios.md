# PSP Mock Server Scenarios

## Objetivo

Expandir o mock server com cenários previsíveis para validar:

- paginação
- reimportação idempotente
- atualização por versão mais nova
- rejeição de dados inválidos
- descarte de meios de pagamento fora do escopo

## Estratégia de seleção

A seleção de cenário é feita por query param:

- `scenario=default`
- `scenario=pagination`
- `scenario=reimport`
- `scenario=validation`

Exemplos:

### Pagar.me

- `/core/v5/orders?scenario=pagination&page=1&size=2`
- `/core/v5/orders/or_pag_page_003?scenario=pagination`

### Mercado Pago

- `/v1/payments/search?scenario=validation&payment_type_id=credit_card&offset=0&limit=10`
- `/v1/payments/3003?scenario=pagination`

## Cenários disponíveis

### default

Massa base válida para consumo normal dos adapters.

### pagination

Contém pelo menos 5 registros para permitir:

- múltiplas páginas
- última página incompleta
- teste de avanço e parada

### reimport

Contém:

- registro duplicado para reimportação idempotente
- registro com `updatedAt` ou equivalente mais novo

### validation

Contém:

- registro sem pagador
- registro sem parcelas completas
- registro fora do escopo de cartão

## Regras

- mesmo cenário + mesmos parâmetros = mesma resposta
- detalhe precisa existir e ser coerente com a listagem
- o mock não aplica regra de negócio da aplicação
- o mock só fornece massa controlada para os testes

## Observação importante

No cenário `validation` do Mercado Pago, a rota de busca continua respeitando o filtro `payment_type_id`.

Isso permite testar:

- rejeição de payload inválido de cartão
- descarte de `pix` ou outro meio fora do escopo
