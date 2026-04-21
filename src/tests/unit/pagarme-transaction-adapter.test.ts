import { describe, expect, it } from 'vitest';
import { PagarmeTransactionAdapter } from '../../modules/psp/infrastructure/clients/pagarme/PagarmeTransactionAdapter';
import type { PagarmeOrderResponse } from '../../modules/psp/infrastructure/clients/pagarme/pagarme.schemas';
import { DomainError, ValidationError } from '../../modules/shared/application/errors';
import { DocumentHashService } from '../../modules/shared/infrastructure/security/DocumentHashService';

function createValidOrder(overrides?: Partial<PagarmeOrderResponse>): PagarmeOrderResponse {
  return {
    id: 'or_123',
    code: 'CODE123',
    amount: 10000,
    currency: 'BRL',
    status: 'paid',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:31:00Z',
    customer: {
      id: 'cus_123',
      name: 'Maria Silva',
      email: 'maria@example.com',
      document: '123.456.789-01',
      document_type: 'CPF',
      type: 'individual',
    },
    charges: [
      {
        id: 'ch_123',
        amount: 10000,
        paid_amount: 9700,
        status: 'paid',
        payment_method: 'credit_card',
        last_transaction: {
          id: 'tran_123',
          transaction_type: 'credit_card',
          amount: 10000,
          installments: 3,
          status: 'captured',
          gateway_response: {
            code: '00',
          },
        },
      },
    ],
    ...overrides,
  };
}

describe('PagarmeTransactionAdapter', () => {
  it('deve adaptar pedido valido para modelo canônico', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder();

    const result = adapter.adapt(order);

    expect(result.id).toBe(0);
    expect(result.externalReference).toEqual({
      psp: 'pagarme',
      externalId: 'or_123',
    });
    expect(result.paymentMethod).toBe('credit_card');
    expect(result.status).toBe('paid');
    expect(result.originalAmount.amountInCents).toBe(10000);
    expect(result.netAmount.amountInCents).toBe(9700);
    expect(result.fees.amountInCents).toBe(300);
    expect(result.installmentCount).toBe(3);
    expect(result.currency).toBe('BRL');
    expect(result.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect(result.updatedAt.toISOString()).toBe('2024-01-15T10:31:00.000Z');
  });

  it('deve gerar payerSnapshot com hash de documento sem expor documento puro', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder();

    const result = adapter.adapt(order);

    expect(result.payerSnapshot).toEqual({
      externalId: 'cus_123',
      name: 'Maria Silva',
      email: 'maria@example.com',
      documentHash: {
        value: DocumentHashService.hash('12345678901'),
      },
      documentType: 'cpf',
    });

    expect(result.payerSnapshot.documentHash.value).not.toContain('12345678901');
  });

  it('deve montar parcelas coerentes com o numero de parcelas', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder();

    const result = adapter.adapt(order);

    expect(result.installments).toHaveLength(3);
    expect(result.installments.map((item) => item.installmentNumber)).toEqual([1, 2, 3]);
    expect(result.installments.map((item) => item.status)).toEqual(['paid', 'paid', 'paid']);

    const totalAmount = result.installments.reduce(
      (acc, item) => acc + item.amount.amountInCents,
      0,
    );

    const totalFees = result.installments.reduce((acc, item) => acc + item.fees.amountInCents, 0);

    expect(totalAmount).toBe(10000);
    expect(totalFees).toBe(300);
  });

  it('deve distribuir arredondamento das parcelas corretamente', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      amount: 10001,
      charges: [
        {
          id: 'ch_123',
          amount: 10001,
          paid_amount: 9700,
          status: 'paid',
          payment_method: 'credit_card',
          last_transaction: {
            id: 'tran_123',
            transaction_type: 'credit_card',
            amount: 10001,
            installments: 3,
            status: 'captured',
          },
        },
      ],
    });

    const result = adapter.adapt(order);

    expect(result.installments.map((item) => item.amount.amountInCents)).toEqual([
      3334, 3334, 3333,
    ]);
    expect(result.installments.reduce((acc, item) => acc + item.amount.amountInCents, 0)).toBe(
      10001,
    );
  });

  it('deve mapear status para pending quando pedido estiver pendente', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      status: 'pending',
      charges: [
        {
          id: 'ch_123',
          amount: 10000,
          paid_amount: 9700,
          status: 'pending',
          payment_method: 'credit_card',
          last_transaction: {
            id: 'tran_123',
            transaction_type: 'credit_card',
            amount: 10000,
            installments: 3,
            status: 'processing',
          },
        },
      ],
    });

    const result = adapter.adapt(order);

    expect(result.status).toBe('pending');
    expect(result.installments.every((item) => item.status === 'pending')).toBe(true);
  });

  it('deve mapear status desconhecido para unknown', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      status: 'weird_status',
      charges: [
        {
          id: 'ch_123',
          amount: 10000,
          paid_amount: 9700,
          status: 'strange',
          payment_method: 'credit_card',
          last_transaction: {
            id: 'tran_123',
            transaction_type: 'credit_card',
            amount: 10000,
            installments: 3,
            status: 'something_else',
          },
        },
      ],
    });

    const result = adapter.adapt(order);

    expect(result.status).toBe('unknown');
    expect(result.installments.every((item) => item.status === 'unknown')).toBe(true);
  });

  it('deve falhar quando nao houver charge elegivel de cartao', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      charges: [
        {
          id: 'ch_123',
          amount: 10000,
          paid_amount: 9700,
          status: 'paid',
          payment_method: 'pix',
          last_transaction: {
            id: 'tran_123',
            transaction_type: 'pix',
            amount: 10000,
            installments: 1,
            status: 'paid',
          },
        },
      ],
    });

    expect(() => adapter.adapt(order)).toThrow(DomainError);
  });

  it('deve falhar quando dados do pagador estiverem incompletos', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      customer: {
        id: 'cus_123',
        name: 'Maria Silva',
        email: '',
        document: '12345678901',
        document_type: 'CPF',
      },
    });

    expect(() => adapter.adapt(order)).toThrow(DomainError);
  });

  it('deve falhar quando documento do pagador for invalido', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      customer: {
        id: 'cus_123',
        name: 'Maria Silva',
        email: 'maria@example.com',
        document: '---',
        document_type: 'CPF',
      },
    });

    expect(() => adapter.adapt(order)).toThrow(DomainError);
  });

  it('deve falhar quando parcelas estiverem ausentes ou invalidas', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      charges: [
        {
          id: 'ch_123',
          amount: 10000,
          paid_amount: 9700,
          status: 'paid',
          payment_method: 'credit_card',
          last_transaction: {
            id: 'tran_123',
            transaction_type: 'credit_card',
            amount: 10000,
            installments: 0,
            status: 'captured',
          },
        },
      ],
    });

    expect(() => adapter.adapt(order)).toThrow(DomainError);
  });

  it('deve falhar quando order id estiver ausente', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      id: '',
    });

    expect(() => adapter.adapt(order)).toThrow(ValidationError);
  });

  it('deve falhar quando amount for invalido', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      amount: undefined,
    });

    expect(() => adapter.adapt(order)).toThrow(ValidationError);
  });

  it('deve falhar quando datas forem invalidas', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      created_at: 'data-invalida',
    });

    expect(() => adapter.adapt(order)).toThrow(ValidationError);
  });

  it('deve usar customer.id opcionalmente sem quebrar', () => {
    const adapter = new PagarmeTransactionAdapter();
    const order = createValidOrder({
      customer: {
        id: undefined,
        name: 'Maria Silva',
        email: 'maria@example.com',
        document: '12345678901',
        document_type: 'CPF',
      },
    });

    const result = adapter.adapt(order);

    expect(result.payerSnapshot.externalId).toBeUndefined();
  });
});
