import type { ReconciliationCaseType, ReconciliationDecision } from '../dto/ReconciliationDecision';
import { ReconciliationSeverityClassifier } from './ReconciliationSeverityClassifier';

export class ReconciliationEngine {
  public constructor(
    private readonly reconciliationSeverityClassifier: ReconciliationSeverityClassifier,
  ) {}

  public decide(params: {
    conflictType:
      | 'financial_divergence'
      | 'invalid_status_regression'
      | 'payer_identity_divergence'
      | 'installment_divergence'
      | 'audit_field_divergence';
    repeatedKnownConflict?: boolean;
    safelyAutoResolvable?: boolean;
  }): ReconciliationDecision {
    const caseType = this.mapConflictToCaseType(params.conflictType);
    const severity = this.reconciliationSeverityClassifier.classify(caseType);

    if (params.repeatedKnownConflict && params.safelyAutoResolvable) {
      return {
        decision: 'case_opened_and_auto_resolved',
        caseType,
        severity,
        caseStatus: 'auto_resolved',
        initialAction: 'auto_resolved',
        reason: 'Known conflict safely auto-resolved',
        shouldOpenCase: true,
        autoResolved: true,
      };
    }

    if (caseType === 'installment_inconsistency') {
      return {
        decision: 'case_opened_and_pending_reprocessing',
        caseType,
        severity,
        caseStatus: 'pending_reprocessing',
        initialAction: 'marked_for_reprocessing',
        reason: 'Installment inconsistency requires reprocessing',
        shouldOpenCase: true,
        autoResolved: false,
      };
    }

    return {
      decision: 'case_opened_and_requires_review',
      caseType,
      severity,
      caseStatus: 'under_review',
      initialAction: 'case_opened',
      reason: 'Relevant divergence requires reconciliation review',
      shouldOpenCase: true,
      autoResolved: false,
    };
  }

  private mapConflictToCaseType(conflictType: string): ReconciliationCaseType {
    switch (conflictType) {
      case 'financial_divergence':
        return 'financial_divergence';
      case 'invalid_status_regression':
        return 'status_inconsistency';
      case 'payer_identity_divergence':
        return 'payer_inconsistency';
      case 'installment_divergence':
        return 'installment_inconsistency';
      case 'audit_field_divergence':
        return 'audit_field_conflict';
      default:
        return 'unresolved_merge';
    }
  }
}
