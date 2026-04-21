import { describe, expect, it } from 'vitest';
import { MercadoPagoTransactionAdapter } from '../../modules/psp/infrastructure/clients/mercadopago/MercadoPagoTransactionAdapter';
import type { MercadoPagoPaymentResponse } from '../../modules/psp/infrastructure/clients/mercadopago/mercadopago.schemas';
import { DomainError, ValidationError } from '../../modules/shared/application/errors';
import { DocumentHashService } from '../../modules/shared/infrastructure/security/DocumentHashService';

function createValidPayment(
  overrides?: Partial<MercadoPagoPaymentResponse>,
): MercadoPagoPaymentResponse {
  return {
    id: 123456789,
    date_created: '2024-01-15T10:30:00.000-03:00',
    date_approved: '2024-01-15T10:31:00.000-03:00',
    date_last_updated: '2024-01-15T10:31:00.000-03:00',
    payment_type_id: 'credit_card',
    status: 'approved',
    status_detail: 'accredited',
    currency_id: 'BRL',
    transaction_amount: 100.0,
    net_received_amount: 97.0,
    total_paid_amount: 100.0,
    installments: 3,
    fee_details: [
      {
        type: 'mercadopago_fee',
        amount: 3.0,
        fee_payer: 'collector',
      },
    ],
    payer: {
      id: '987654321',
      email: 'joao@example.com',
      first_name: 'João',
      last_name: 'Souza',
      identification: {
        type: 'CPF',
        number: '98765432100',
      },
    },
    ...overrides,
  };
}

describe('MercadoPagoTransactionAdapter', () => {
  it('deve adaptar pagamento válido para modelo canônico', () => {
    const adapter = new MercadoPagoTransactionAdapter();
    const payment = createValidPayment();

    const result = adapter.adapt(payment);

    expect(result.id).toBe(0);
    expect(result.externalReference).toEqual({
      psp: 'mercadopago',
      externalId: '123456789',
    });
    expect(result.paymentMethod).toBe('credit_card');
    expect(result.status).toBe('paid');
    expect(result.originalAmount.amountInCents).toBe(10000);
    expect(result.netAmount.amountInCents).toBe(9700);
    expect(result.fees.amountInCents).toBe(300);
    expect(result.installmentCount).toBe(3);
    expect(result.currency).toBe('BRL');
  });

  it('deve gerar payerSnapshot com hash de documento', () => {
    const adapter = new MercadoPagoTransactionAdapter();
    const payment = createValidPayment();

    const result = adapter.adapt(payment);

    expect(result.payerSnapshot).toEqual({
      externalId: '987654321',
      name: 'João Souza',
      email: 'joao@example.com',
      documentHash: {
        value: DocumentHashService.hash('98765432100'),
      },
      documentType: 'cpf',
    });

    expect(result.payerSnapshot.documentHash.value).not.toContain('98765432100');
  });

  it('deve montar parcelas coerentes', () => {
    const adapter = new MercadoPagoTransactionAdapter();
    const payment = createValidPayment();

    const result = adapter.adapt(payment);

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

  it('deve converter decimal para centavos corretamente', () => {
    const adapter = new MercadoPagoTransactionAdapter();
    const payment = createValidPayment({
      transaction_amount: 100.01,
      net_received_amount: 97.0,
      fee_details: [
        {
          type: 'mercadopago_fee',
          amount: 3.01,
          fee_payer: 'collector',
        },
      ],
    });

    const result = adapter.adapt(payment);

    expect(result.originalAmount.amountInCents).toBe(10001);
    expect(result.fees.amountInCents).toBe(301);
  });

  it('deve mapear approved/accredited para paid', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    const result = adapter.adapt(
      createValidPayment({
        status: 'approved',
        status_detail: 'accredited',
      }),
    );

    expect(result.status).toBe('paid');
  });

  it('deve mapear pending para pending', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    const result = adapter.adapt(
      createValidPayment({
        status: 'pending',
        status_detail: 'pending_waiting_payment',
      }),
    );

    expect(result.status).toBe('pending');
    expect(result.installments.every((item) => item.status === 'pending')).toBe(true);
  });

  it('deve mapear rejected para failed', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    const result = adapter.adapt(
      createValidPayment({
        status: 'rejected',
        status_detail: 'cc_rejected_other_reason',
      }),
    );

    expect(result.status).toBe('failed');
    expect(result.installments.every((item) => item.status === 'failed')).toBe(true);
  });

  it('deve mapear status desconhecido para unknown', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    const result = adapter.adapt(
      createValidPayment({
        status: 'weird_status',
        status_detail: 'strange_detail',
      }),
    );

    expect(result.status).toBe('unknown');
  });

  it('deve falhar quando payment_type_id nao for credit_card', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          payment_type_id: 'pix',
        }),
      ),
    ).toThrow(DomainError);
  });

  it('deve falhar quando payer estiver incompleto', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          payer: {
            id: '987654321',
            email: '',
            first_name: 'João',
            last_name: 'Souza',
            identification: {
              type: 'CPF',
              number: '98765432100',
            },
          },
        }),
      ),
    ).toThrow(DomainError);
  });

  it('deve falhar quando documento for inválido', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          payer: {
            id: '987654321',
            email: 'joao@example.com',
            first_name: 'João',
            last_name: 'Souza',
            identification: {
              type: 'CPF',
              number: '---',
            },
          },
        }),
      ),
    ).toThrow(DomainError);
  });

  it('deve falhar quando installments forem inválidas', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          installments: 0,
        }),
      ),
    ).toThrow(DomainError);
  });

  it('deve falhar quando id estiver ausente', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          id: undefined,
        }),
      ),
    ).toThrow(ValidationError);
  });

  it('deve falhar quando transaction_amount for inválido', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          transaction_amount: undefined,
        }),
      ),
    ).toThrow(ValidationError);
  });

  it('deve falhar quando data for inválida', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    expect(() =>
      adapter.adapt(
        createValidPayment({
          date_created: 'data-invalida',
        }),
      ),
    ).toThrow(ValidationError);
  });

  it('deve usar payer.id opcionalmente sem quebrar', () => {
    const adapter = new MercadoPagoTransactionAdapter();

    const result = adapter.adapt(
      createValidPayment({
        payer: {
          id: undefined,
          email: 'joao@example.com',
          first_name: 'João',
          last_name: 'Souza',
          identification: {
            type: 'CPF',
            number: '98765432100',
          },
        },
      }),
    );

    expect(result.payerSnapshot.externalId).toBeUndefined();
  });
});
