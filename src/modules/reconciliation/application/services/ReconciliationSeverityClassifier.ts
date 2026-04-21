import type { ReconciliationCaseType, ReconciliationSeverity } from '../dto/ReconciliationDecision';

export class ReconciliationSeverityClassifier {
  public classify(caseType: ReconciliationCaseType): ReconciliationSeverity {
    switch (caseType) {
      case 'audit_field_conflict':
        return 'critical';
      case 'financial_divergence':
      case 'status_inconsistency':
      case 'out_of_order_event':
      case 'payer_inconsistency':
        return 'high';
      case 'installment_inconsistency':
        return 'medium';
      case 'unresolved_merge':
      default:
        return 'low';
    }
  }
}
