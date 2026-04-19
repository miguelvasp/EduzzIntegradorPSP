export const PspType = {
  PAGARME: 'pagarme',
  MERCADO_PAGO: 'mercadopago',
} as const;

export type PspType = (typeof PspType)[keyof typeof PspType];
