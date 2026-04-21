import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class PaymentMethodScopeValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    if (transaction.paymentMethod === 'credit_card') {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'out_of_scope_payment_method',
        message: 'Only credit card transactions are allowed',
        field: 'paymentMethod',
      }),
    ];
  }
}
