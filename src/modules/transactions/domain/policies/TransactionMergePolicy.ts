import type { TransactionEntity } from '../entities';
import { ConflictClassifier } from '../services/ConflictClassifier';
import type { MergeDecision } from '../value-objects/MergeDecision';
import { TransactionStatusTransitionPolicy } from './TransactionStatusTransitionPolicy';

export class TransactionMergePolicy {
  public constructor(
    private readonly statusTransitionPolicy: TransactionStatusTransitionPolicy,
    private readonly conflictClassifier: ConflictClassifier,
  ) {}

  public evaluate(current: TransactionEntity, incoming: TransactionEntity): MergeDecision {
    const preservedFields: string[] = [];
    const updatedFields: string[] = [];

    if (this.hasAuditFieldDivergence(current, incoming)) {
      return {
        decision: 'conflict_detected',
        reason: 'Audit fields diverged',
        updatedFields: [],
        preservedFields: ['externalReference.psp', 'externalReference.externalId', 'createdAt'],
        conflictType: this.conflictClassifier.classify({
          auditFieldDiverged: true,
        }),
      };
    }

    if (this.hasFinancialDivergence(current, incoming)) {
      return {
        decision: 'conflict_detected',
        reason: 'Financial fields diverged',
        updatedFields: [],
        preservedFields: ['originalAmount', 'netAmount', 'fees', 'installmentCount'],
        conflictType: this.conflictClassifier.classify({
          financialFieldDiverged: true,
        }),
      };
    }

    if (this.hasPayerIdentityDivergence(current, incoming)) {
      return {
        decision: 'conflict_detected',
        reason: 'Payer identity diverged',
        updatedFields: [],
        preservedFields: ['payerSnapshot.documentHash', 'payerSnapshot.documentType'],
        conflictType: this.conflictClassifier.classify({
          payerIdentityDiverged: true,
        }),
      };
    }

    if (this.hasInstallmentDivergence(current, incoming)) {
      return {
        decision: 'conflict_detected',
        reason: 'Installment structure diverged',
        updatedFields: [],
        preservedFields: ['installments', 'installmentCount'],
        conflictType: this.conflictClassifier.classify({
          installmentDiverged: true,
        }),
      };
    }

    const statusDecision = this.statusTransitionPolicy.evaluate({
      currentStatus: current.status,
      nextStatus: incoming.status,
    });

    if (statusDecision.decision === 'invalid') {
      return {
        decision: 'conflict_detected',
        reason: statusDecision.reason,
        updatedFields: [],
        preservedFields: ['status'],
        conflictType: this.conflictClassifier.classify({
          invalidStatusRegression: true,
        }),
      };
    }

    if (statusDecision.decision === 'suspicious') {
      return {
        decision: 'reconciliation_required',
        reason: statusDecision.reason,
        updatedFields: [],
        preservedFields: ['status'],
      };
    }

    if (statusDecision.decision === 'valid') {
      updatedFields.push('status');
    } else {
      preservedFields.push('status');
    }

    if (current.updatedAt.getTime() !== incoming.updatedAt.getTime()) {
      updatedFields.push('updatedAt');
    } else {
      preservedFields.push('updatedAt');
    }

    if (current.payerSnapshot?.name !== incoming.payerSnapshot?.name) {
      updatedFields.push('payerSnapshot.name');
    } else {
      preservedFields.push('payerSnapshot.name');
    }

    if (current.payerSnapshot?.email !== incoming.payerSnapshot?.email) {
      updatedFields.push('payerSnapshot.email');
    } else {
      preservedFields.push('payerSnapshot.email');
    }

    if (updatedFields.length === 0) {
      return {
        decision: 'no_change',
        reason: 'Equivalent transaction snapshot',
        updatedFields,
        preservedFields,
      };
    }

    return {
      decision: 'safe_update',
      reason: 'Only safe operational fields changed',
      updatedFields,
      preservedFields,
    };
  }

  private hasAuditFieldDivergence(
    current: TransactionEntity,
    incoming: TransactionEntity,
  ): boolean {
    if (current.externalReference.psp !== incoming.externalReference.psp) {
      return true;
    }

    if (current.externalReference.externalId !== incoming.externalReference.externalId) {
      return true;
    }

    if (current.createdAt.getTime() !== incoming.createdAt.getTime()) {
      return true;
    }

    return false;
  }

  private hasFinancialDivergence(current: TransactionEntity, incoming: TransactionEntity): boolean {
    if (current.originalAmount.amountInCents !== incoming.originalAmount.amountInCents) {
      return true;
    }

    if (current.netAmount.amountInCents !== incoming.netAmount.amountInCents) {
      return true;
    }

    if (current.fees.amountInCents !== incoming.fees.amountInCents) {
      return true;
    }

    if (current.installmentCount !== incoming.installmentCount) {
      return true;
    }

    return false;
  }

  private hasPayerIdentityDivergence(
    current: TransactionEntity,
    incoming: TransactionEntity,
  ): boolean {
    if (
      current.payerSnapshot?.documentHash?.value !== incoming.payerSnapshot?.documentHash?.value
    ) {
      return true;
    }

    if (current.payerSnapshot?.documentType !== incoming.payerSnapshot?.documentType) {
      return true;
    }

    return false;
  }

  private hasInstallmentDivergence(
    current: TransactionEntity,
    incoming: TransactionEntity,
  ): boolean {
    if (current.installments.length !== incoming.installments.length) {
      return true;
    }

    return current.installments.some((currentInstallment, index) => {
      const incomingInstallment = incoming.installments[index];

      if (!incomingInstallment) {
        return true;
      }

      if (currentInstallment.installmentNumber !== incomingInstallment.installmentNumber) {
        return true;
      }

      if (currentInstallment.amount.amountInCents !== incomingInstallment.amount.amountInCents) {
        return true;
      }

      return false;
    });
  }
}
