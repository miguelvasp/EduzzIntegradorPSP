import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class AmountConsistencyValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    const originalAmount = transaction.originalAmount?.amountInCents;
    const netAmount = transaction.netAmount?.amountInCents;
    const fees = transaction.fees?.amountInCents;

    if (
      typeof originalAmount === 'number' &&
      typeof netAmount === 'number' &&
      typeof fees === 'number' &&
      originalAmount >= 0 &&
      netAmount >= 0 &&
      fees >= 0 &&
      originalAmount >= netAmount
    ) {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'invalid_amount_consistency',
        message: 'Transaction amounts are inconsistent',
        field: 'amounts',
      }),
    ];
  }
}
