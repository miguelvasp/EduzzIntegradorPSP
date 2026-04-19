export const RejectionReason = {
  INCOMPLETE_PAYER_DATA: 'incomplete_payer_data',
  INCOMPLETE_INSTALLMENTS: 'incomplete_installments',
  INVALID_DOCUMENT: 'invalid_document',
  UNSUPPORTED_PAYMENT_METHOD: 'unsupported_payment_method',
  INVALID_EXTERNAL_PAYLOAD: 'invalid_external_payload',
} as const;

export type RejectionReason = (typeof RejectionReason)[keyof typeof RejectionReason];
