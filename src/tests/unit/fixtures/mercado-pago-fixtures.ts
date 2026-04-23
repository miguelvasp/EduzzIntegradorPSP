export function createMercadoPagoPaymentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 1001,
    status: 'approved',
    status_detail: 'accredited',
    currency_id: 'BRL',
    transaction_amount: 150.5,
    net_received_amount: 145.5,
    installments: 3,
    date_created: '2026-04-21T09:00:00.000Z',
    date_last_updated: '2026-04-21T10:00:00.000Z',
    date_approved: '2026-04-21T10:00:00.000Z',
    payment_type_id: 'credit_card',
    payer: {
      id: 'mp_payer_001',
      email: 'ana@example.com',
      first_name: 'Ana',
      last_name: 'Lima',
      identification: {
        type: 'CPF',
        number: '12345678901',
      },
    },
    fee_details: [
      {
        amount: 5,
      },
    ],
    card: {
      first_six_digits: '411111',
      last_four_digits: '1111',
      cardholder: {
        name: 'Ana Lima',
      },
    },
    ...overrides,
  };
}
