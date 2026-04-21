import type { MergeConflictType } from '../value-objects/MergeDecision';

export class ConflictClassifier {
  public classify(params: {
    auditFieldDiverged?: boolean;
    financialFieldDiverged?: boolean;
    payerIdentityDiverged?: boolean;
    installmentDiverged?: boolean;
    invalidStatusRegression?: boolean;
  }): MergeConflictType {
    if (params.invalidStatusRegression) {
      return 'invalid_status_regression';
    }

    if (params.financialFieldDiverged) {
      return 'financial_divergence';
    }

    if (params.payerIdentityDiverged) {
      return 'payer_identity_divergence';
    }

    if (params.installmentDiverged) {
      return 'installment_divergence';
    }

    return 'audit_field_divergence';
  }
}
