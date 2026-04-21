import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type GetTransactionByIdQueryInput = {
  id: number | string;
};

export type GetTransactionByIdQuery = {
  id: number;
};

export function normalizeGetTransactionByIdQuery(
  input: GetTransactionByIdQueryInput,
): GetTransactionByIdQuery {
  const parsedId = typeof input.id === 'string' ? Number(input.id) : input.id;

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new ValidationError({
      message: 'Invalid transaction id parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'id',
        value: input.id,
      },
    });
  }

  return {
    id: parsedId,
  };
}
