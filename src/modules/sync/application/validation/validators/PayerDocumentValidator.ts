import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class PayerDocumentValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    if (transaction.payerSnapshot?.documentHash?.value && transaction.payerSnapshot?.documentType) {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'unprocessable_payer_document',
        message: 'Payer document must be processable',
        field: 'payerSnapshot.documentHash',
      }),
    ];
  }
}
