import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class PayerPresenceValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    if (transaction.payerSnapshot) {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'missing_payer',
        message: 'Payer data is required',
        field: 'payerSnapshot',
      }),
    ];
  }
}
