import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type ListTransactionInstallmentsQueryInput = {
  transactionId: number | string;
};

export type ListTransactionInstallmentsQuery = {
  transactionId: number;
};

export function normalizeListTransactionInstallmentsQuery(
  input: ListTransactionInstallmentsQueryInput,
): ListTransactionInstallmentsQuery {
  const parsedId =
    typeof input.transactionId === 'string' ? Number(input.transactionId) : input.transactionId;

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new ValidationError({
      message: 'Invalid transaction id parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'transactionId',
        value: input.transactionId,
      },
    });
  }

  return {
    transactionId: parsedId,
  };
}
