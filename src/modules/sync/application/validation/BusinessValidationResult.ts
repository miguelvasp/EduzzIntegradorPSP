export type BusinessValidationStatus = 'valid' | 'rejected_by_business_rule';

export type BusinessValidationFailureCode =
  | 'out_of_scope_payment_method'
  | 'missing_payer'
  | 'unprocessable_payer_document'
  | 'incomplete_installments'
  | 'missing_external_id'
  | 'invalid_amount_consistency';

export type BusinessValidationFailure = {
  code: BusinessValidationFailureCode;
  message: string;
  field?: string;
};

export type BusinessValidationResult = {
  isValid: boolean;
  status: BusinessValidationStatus;
  failures: BusinessValidationFailure[];
};
