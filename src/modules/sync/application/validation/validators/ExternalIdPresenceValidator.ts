import type { TransactionEntity } from '../../../../transactions/domain/entities';
import type { BusinessValidationFailure } from '../BusinessValidationResult';
import { ValidationFailureClassifier } from '../ValidationFailureClassifier';

export class ExternalIdPresenceValidator {
  public constructor(private readonly classifier: ValidationFailureClassifier) {}

  public validate(transaction: TransactionEntity): BusinessValidationFailure[] {
    if (transaction.externalReference?.externalId?.trim()) {
      return [];
    }

    return [
      this.classifier.classify({
        code: 'missing_external_id',
        message: 'External id is required',
        field: 'externalReference.externalId',
      }),
    ];
  }
}
