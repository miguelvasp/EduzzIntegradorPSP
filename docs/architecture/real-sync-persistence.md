# Real Sync Persistence

## Objetivo

Este documento descreve como a sincronização deixa de operar apenas em memória e passa a persistir dados reais no SQL Server.

A persistência real da sincronização cobre:

- transação;
- parcelas;
- pagador;
- checkpoint;
- idempotência;
- rejeições;
- conflitos;
- outbox.

## Fluxo

A execução da sincronização segue o fluxo abaixo:

1. buscar páginas no PSP ou mock server;
2. adaptar o payload para o modelo canônico;
3. validar o item;
4. processar item com isolamento de erro;
5. persistir item válido no SQL Server;
6. registrar rejeição ou conflito quando aplicável;
7. atualizar checkpoint;
8. registrar evento interno no outbox dentro da mesma unidade transacional.

## Persistência principal

### Transaction

A transação é persistida com:

- `psp`
- `externalId`
- `status`
- `paymentMethod`
- valores monetários
- datas do PSP
- vínculo com pagador
- metadados de sincronização

A chave lógica de idempotência é:

- `psp + externalId`

### Installment

As parcelas são persistidas vinculadas à transação.

A estratégia atual substitui o conjunto de parcelas da transação durante o merge persistente para manter consistência com o payload mais recente aceito.

### Payer

O pagador é persistido com:

- `externalId`
- nome
- e-mail
- `documentHash`
- `documentType`

Regra obrigatória:

- o documento nunca é persistido em texto puro.

### Payer snapshot

Além do pagador consolidado, a sincronização registra snapshot vinculado à transação para manter rastreabilidade do estado observado no momento da ingestão.

## Idempotência

A sincronização usa como identidade lógica do item:

- `psp + externalId`

Com isso, o fluxo distingue:

- inserção inicial;
- atualização legítima;
- reprocessamento sem duplicidade.

A decisão de idempotência é registrada na infraestrutura persistente.

## Checkpoint

O checkpoint é persistido por PSP.

Ele permite continuidade segura da execução incremental, registrando:

- PSP
- referência temporal da última sincronização útil
- página, offset ou cursor quando aplicável
- timestamp de atualização

## Rejeições

Itens inválidos não devem colapsar a execução inteira.

Quando aplicável, a sincronização registra:

- falha de validação;
- rejeição de negócio;
- motivo rastreável.

Isso cobre cenários como:

- ausência de pagador;
- parcelas incompletas;
- método de pagamento fora do escopo;
- dados obrigatórios inválidos.

## Conflitos

Quando o domínio identifica divergência relevante, a sincronização registra conflito persistido.

Exemplos:

- `amount_mismatch`
- `net_amount_mismatch`
- `fees_mismatch`
- `installment_count_mismatch`
- `invalid_status_transition`
- `out_of_order_event`

Quando necessário, a persistência também abre caso de reconciliação.

## Outbox

A mutação persistida e o evento interno correspondente devem ocorrer na mesma unidade transacional.

Isso evita inconsistência entre:

- dado consolidado no banco;
- sinalização interna para processamento posterior.

## Segurança

A persistência real da sincronização respeita estas regras:

- `document` nunca em texto puro;
- payloads sensíveis sanitizados;
- logs sem vazamento indevido;
- repositórios gravando `documentHash` no lugar do documento bruto.

## Resultado esperado

Com essa base, a sincronização passa a produzir estado real e consultável no banco, deixando de ser apenas pipeline lógico.

Isso habilita:

- consulta futura pela API;
- testes de integração reais;
- reprocessamento idempotente;
- rastreabilidade operacional;
- evidência concreta para demonstração do desafio.
