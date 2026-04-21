import type { TransactionEntity } from '../../../transactions/domain/entities';
import type {
  BusinessValidationFailure,
  BusinessValidationResult,
} from './BusinessValidationResult';

type TransactionBusinessValidator = {
  validate(transaction: TransactionEntity): BusinessValidationFailure[];
};

export class IngestionValidationPipeline {
  public constructor(private readonly validators: TransactionBusinessValidator[]) {}

  public validate(transaction: TransactionEntity): BusinessValidationResult {
    const failures = this.validators.flatMap((validator) => validator.validate(transaction));

    if (failures.length === 0) {
      return {
        isValid: true,
        status: 'valid',
        failures: [],
      };
    }

    return {
      isValid: false,
      status: 'rejected_by_business_rule',
      failures,
    };
  }
}
