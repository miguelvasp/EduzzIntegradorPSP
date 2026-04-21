import { PspType } from '../../../shared/domain/enums/pspType';

export type ReconciliationCaseType =
  | 'financial_divergence'
  | 'status_inconsistency'
  | 'out_of_order_event'
  | 'audit_field_conflict'
  | 'payer_inconsistency'
  | 'installment_inconsistency'
  | 'unresolved_merge';

export type ReconciliationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ReconciliationCaseStatus =
  | 'open'
  | 'pending_reprocessing'
  | 'auto_resolved'
  | 'under_review'
  | 'resolved'
  | 'closed_without_change';

export type ReconciliationInitialAction =
  | 'case_opened'
  | 'marked_for_reprocessing'
  | 'auto_resolved'
  | 'no_state_change_applied'
  | 'conflict_persisted'
  | 'case_closed';

export type ReconciliationDecisionType =
  | 'case_opened'
  | 'case_opened_and_auto_resolved'
  | 'case_opened_and_pending_reprocessing'
  | 'case_opened_and_requires_review';

export type ReconciliationDecision = {
  decision: ReconciliationDecisionType;
  caseType: ReconciliationCaseType;
  severity: ReconciliationSeverity;
  caseStatus: ReconciliationCaseStatus;
  initialAction: ReconciliationInitialAction;
  reason: string;
  shouldOpenCase: boolean;
  autoResolved: boolean;
};

export type ReconciliationCaseRecord = {
  id: string;
  caseType: ReconciliationCaseType;
  severity: ReconciliationSeverity;
  status: ReconciliationCaseStatus;
  transactionId?: number;
  externalId: string;
  psp: PspType;
  syncRunId?: string;
  reason: string;
};

export type ReconciliationActionRecord = {
  caseId: string;
  action: ReconciliationInitialAction;
  reason: string;
  syncRunId?: string;
};
