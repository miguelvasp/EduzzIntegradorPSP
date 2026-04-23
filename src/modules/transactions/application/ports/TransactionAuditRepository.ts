import type { PspType } from '../../../shared/domain/enums/pspType';
import type { CanonicalInstallmentStatus, CanonicalTransactionStatus } from '../../domain/entities';

export type RecordTransactionEventInput = {
  transactionId: number;
  eventType: string;
  eventStatus: string;
  occurredAt: Date;
  syncRunId?: number;
  payloadJson?: string;
  payloadHash?: string;
};

export type RecordTransactionStatusHistoryInput = {
  transactionId: number;
  previousStatus?: CanonicalTransactionStatus;
  newStatus: CanonicalTransactionStatus;
  statusSource: string;
  changedAt: Date;
  syncRunId?: number;
  reasonCode?: string;
  notes?: string;
};

export type RecordInstallmentStatusHistoryInput = {
  installmentId: number;
  previousStatus?: CanonicalInstallmentStatus;
  newStatus: CanonicalInstallmentStatus;
  statusSource: string;
  changedAt: Date;
  syncRunId?: number;
  reasonCode?: string;
  notes?: string;
};

export type RecordTransactionIntegrationEvidenceInput = {
  transactionId?: number;
  psp: PspType;
  externalId: string;
  resourceType: string;
  resourceId?: string;
  captureType: string;
  capturedAt: Date;
  syncRunId?: number;
  httpStatusCode?: number;
  payloadJson: string;
  payloadHash: string;
};

export interface TransactionAuditRepository {
  recordTransactionEvent(input: RecordTransactionEventInput): Promise<number>;
  recordTransactionStatusHistory(input: RecordTransactionStatusHistoryInput): Promise<number>;
  recordInstallmentStatusHistory(inputs: RecordInstallmentStatusHistoryInput[]): Promise<void>;
  recordTransactionIntegrationEvidence(
    input: RecordTransactionIntegrationEvidenceInput,
  ): Promise<number>;
}
