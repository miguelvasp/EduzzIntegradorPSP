import type { PspType } from '../../../shared/domain/enums/pspType';

export type CreateDataConflictInput = {
  syncItemId: number;
  pspRawPayloadId?: number;
  transactionId?: number;
  psp: PspType;
  externalId: string;
  conflictType:
    | 'amount_mismatch'
    | 'net_amount_mismatch'
    | 'fees_mismatch'
    | 'installment_count_mismatch'
    | 'invalid_status_transition'
    | 'out_of_order_event'
    | 'payer_identity_mismatch'
    | 'audit_field_overwrite_attempt';
  conflictStatus: 'open' | 'under_analysis' | 'resolved' | 'dismissed';
  existingValue?: string;
  incomingValue?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
};

export interface DataConflictRepository {
  create(input: CreateDataConflictInput): Promise<number>;
}
