import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class InstallmentCompletenessValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    if (
      transaction.installmentCount > 0 &&
      Array.isArray(transaction.installments) &&
      transaction.installments.length === transaction.installmentCount
    ) {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'incomplete_installments',
        message: 'Installments must be complete and consistent',
        field: 'installments',
      }),
    ];
  }
}
