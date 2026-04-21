import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type GetTransactionPayerQueryInput = {
  transactionId: number | string;
};

export type GetTransactionPayerQuery = {
  transactionId: number;
};

export function normalizeGetTransactionPayerQuery(
  input: GetTransactionPayerQueryInput,
): GetTransactionPayerQuery {
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
