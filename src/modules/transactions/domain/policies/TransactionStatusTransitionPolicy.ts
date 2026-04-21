import type { TransactionEntity } from '../entities';

export type TransactionStatusTransitionDecision = 'valid' | 'equivalent' | 'suspicious' | 'invalid';

export type TransactionStatusTransitionResult = {
  decision: TransactionStatusTransitionDecision;
  reason: string;
};

export class TransactionStatusTransitionPolicy {
  public evaluate(params: {
    currentStatus: TransactionEntity['status'];
    nextStatus: TransactionEntity['status'];
  }): TransactionStatusTransitionResult {
    const { currentStatus, nextStatus } = params;

    if (currentStatus === nextStatus) {
      return {
        decision: 'equivalent',
        reason: 'Equivalent status transition',
      };
    }

    if (currentStatus === 'unknown' && nextStatus !== 'unknown') {
      return {
        decision: 'suspicious',
        reason: 'Unknown status evolving to known status',
      };
    }

    if (currentStatus === 'pending' && nextStatus === 'paid') {
      return {
        decision: 'valid',
        reason: 'Pending transaction can become paid',
      };
    }

    if (currentStatus === 'pending' && nextStatus === 'canceled') {
      return {
        decision: 'valid',
        reason: 'Pending transaction can become canceled',
      };
    }

    if (currentStatus === 'paid' && nextStatus === 'refunded') {
      return {
        decision: 'valid',
        reason: 'Paid transaction can become refunded',
      };
    }

    if (currentStatus === 'paid' && nextStatus === 'partially_refunded') {
      return {
        decision: 'valid',
        reason: 'Paid transaction can become partially refunded',
      };
    }

    if (currentStatus === 'paid' && nextStatus === 'pending') {
      return {
        decision: 'invalid',
        reason: 'Paid transaction cannot regress to pending',
      };
    }

    if (currentStatus === 'refunded' && nextStatus === 'paid') {
      return {
        decision: 'invalid',
        reason: 'Refunded transaction cannot regress to paid',
      };
    }

    if (currentStatus === 'canceled' && nextStatus === 'paid') {
      return {
        decision: 'invalid',
        reason: 'Canceled transaction cannot become paid',
      };
    }

    return {
      decision: 'suspicious',
      reason: 'Status transition is not explicitly recognized',
    };
  }
}
