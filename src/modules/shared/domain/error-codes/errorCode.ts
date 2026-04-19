export const ErrorCode = {
  VALIDATION_ERROR: 'validation.error',
  DOMAIN_ERROR: 'domain.error',
  INTEGRATION_ERROR: 'integration.error',
  SECURITY_ERROR: 'security.error',
  CONFIGURATION_ERROR: 'configuration.error',
  INFRASTRUCTURE_ERROR: 'infrastructure.error',
  NOT_FOUND: 'not_found',
  INVALID_PSP_TYPE: 'invalid_psp_type',
  INVALID_TRANSACTION_STATUS: 'invalid_transaction_status',
  INVALID_INSTALLMENT_STATUS: 'invalid_installment_status',
  INVALID_DOCUMENT_TYPE: 'invalid_document_type',
  INCOMPLETE_PAYER_DATA: 'incomplete_payer_data',
  INCOMPLETE_INSTALLMENTS: 'incomplete_installments',
  RECONCILIATION_CONFLICT: 'reconciliation_conflict',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
