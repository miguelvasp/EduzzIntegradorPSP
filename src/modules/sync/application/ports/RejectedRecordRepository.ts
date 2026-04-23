import type { PspType } from '../../../shared/domain/enums/pspType';

export type CreateRejectedRecordInput = {
  syncItemId: number;
  validationFailureId?: number;
  syncRunId: number;
  psp: PspType;
  externalId: string;
  rejectionType:
    | 'rejected_missing_payer'
    | 'rejected_missing_installments'
    | 'rejected_out_of_scope_payment_method'
    | 'rejected_invalid_required_data';
  rejectionReason: string;
  rejectedAt: Date;
};

export interface RejectedRecordRepository {
  create(input: CreateRejectedRecordInput): Promise<number>;
}
