import type { PspType } from '../../../shared/domain/enums/pspType';

export type CreateReconciliationCaseInput = {
  dataConflictId?: number;
  syncItemId?: number;
  transactionId?: number;
  psp: PspType;
  externalId: string;
  caseType:
    | 'financial_divergence'
    | 'status_inconsistency'
    | 'data_incompleteness'
    | 'identity_inconsistency'
    | 'unresolved_conflict';
  caseStatus:
    | 'open'
    | 'pending_reprocessing'
    | 'under_review'
    | 'auto_resolved'
    | 'resolved'
    | 'closed_without_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  openedAt: Date;
};

export interface ReconciliationCaseRepository {
  create(input: CreateReconciliationCaseInput): Promise<number>;
}
