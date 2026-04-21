import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { TransactionEntity } from '../../../transactions/domain/entities';
import type { IdempotencyKey } from '../ports/IdempotencyRepository';

export class IdempotencyKeyResolver {
  public resolve(transaction: TransactionEntity): IdempotencyKey {
    const psp = transaction.externalReference?.psp;
    const externalId = transaction.externalReference?.externalId?.trim();

    if (!psp) {
      throw new ValidationError({
        message: 'Transaction PSP is required for idempotency',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          field: 'externalReference.psp',
        },
      });
    }

    if (!externalId) {
      throw new ValidationError({
        message: 'Transaction externalId is required for idempotency',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          field: 'externalReference.externalId',
        },
      });
    }

    return {
      psp,
      externalId,
    };
  }
}
