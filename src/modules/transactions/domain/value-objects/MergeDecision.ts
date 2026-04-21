export type MergeDecisionType =
  | 'no_change'
  | 'safe_update'
  | 'partial_update'
  | 'conflict_detected'
  | 'reconciliation_required';

export type MergeConflictType =
  | 'audit_field_divergence'
  | 'financial_divergence'
  | 'payer_identity_divergence'
  | 'installment_divergence'
  | 'invalid_status_regression';

export type MergeDecision = {
  decision: MergeDecisionType;
  reason: string;
  updatedFields: string[];
  preservedFields: string[];
  conflictType?: MergeConflictType;
};
