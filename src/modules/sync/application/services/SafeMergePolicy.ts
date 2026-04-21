import type { TransactionEntity } from '../../../transactions/domain/entities';
import type { IdempotencyDecision } from '../ports/IdempotencyRepository';

export type SafeMergePolicyDecision = {
  decision: IdempotencyDecision;
  reason: string;
};

export class SafeMergePolicy {
  public evaluate(
    existing: TransactionEntity,
    incoming: TransactionEntity,
  ): SafeMergePolicyDecision {
    if (this.hasAuditFieldConflict(existing, incoming)) {
      return {
        decision: 'conflicted',
        reason: 'Audit fields diverged',
      };
    }

    if (this.hasAllowedUpdates(existing, incoming)) {
      return {
        decision: 'updated',
        reason: 'Allowed mutable fields changed',
      };
    }

    return {
      decision: 'ignored_as_duplicate',
      reason: 'Equivalent item or no material change',
    };
  }

  private hasAuditFieldConflict(existing: TransactionEntity, incoming: TransactionEntity): boolean {
    if (existing.externalReference.psp !== incoming.externalReference.psp) {
      return true;
    }

    if (existing.externalReference.externalId !== incoming.externalReference.externalId) {
      return true;
    }

    if (existing.originalAmount.amountInCents !== incoming.originalAmount.amountInCents) {
      return true;
    }

    if (existing.currency !== incoming.currency) {
      return true;
    }

    if (existing.createdAt.getTime() !== incoming.createdAt.getTime()) {
      return true;
    }

    if (existing.installmentCount !== incoming.installmentCount) {
      return true;
    }

    if (
      existing.payerSnapshot?.documentHash?.value !== incoming.payerSnapshot?.documentHash?.value
    ) {
      return true;
    }

    if (existing.payerSnapshot?.documentType !== incoming.payerSnapshot?.documentType) {
      return true;
    }

    return false;
  }

  private hasAllowedUpdates(existing: TransactionEntity, incoming: TransactionEntity): boolean {
    if (existing.status !== incoming.status) {
      return true;
    }

    if (existing.netAmount.amountInCents !== incoming.netAmount.amountInCents) {
      return true;
    }

    if (existing.fees.amountInCents !== incoming.fees.amountInCents) {
      return true;
    }

    if (existing.updatedAt.getTime() !== incoming.updatedAt.getTime()) {
      return true;
    }

    if (existing.payerSnapshot?.name !== incoming.payerSnapshot?.name) {
      return true;
    }

    if (existing.payerSnapshot?.email !== incoming.payerSnapshot?.email) {
      return true;
    }

    return false;
  }
}
