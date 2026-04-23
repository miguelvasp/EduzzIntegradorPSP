import type { PspType } from '../../../shared/domain/enums/pspType';

export type CreateValidationFailureInput = {
  syncItemId: number;
  transactionId?: number;
  psp: PspType;
  externalId: string;
  failureType:
    | 'missing_payer'
    | 'missing_installments'
    | 'invalid_payment_method'
    | 'missing_external_id'
    | 'invalid_document'
    | 'incomplete_transaction_data';
  failureCode?: string;
  failureMessage: string;
  occurredAt: Date;
};

export interface ValidationFailureRepository {
  create(input: CreateValidationFailureInput): Promise<number>;
}
