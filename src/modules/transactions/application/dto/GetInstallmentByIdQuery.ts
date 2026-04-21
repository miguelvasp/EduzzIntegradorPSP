import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type GetInstallmentByIdQueryInput = {
  transactionId: number | string;
  installmentId: number | string;
};

export type GetInstallmentByIdQuery = {
  transactionId: number;
  installmentId: number;
};

function parsePositiveInteger(value: number | string, field: string): number {
  const parsed = typeof value === 'string' ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError({
      message: `Invalid ${field} parameter`,
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field,
        value,
      },
    });
  }

  return parsed;
}

export function normalizeGetInstallmentByIdQuery(
  input: GetInstallmentByIdQueryInput,
): GetInstallmentByIdQuery {
  return {
    transactionId: parsePositiveInteger(input.transactionId, 'transactionId'),
    installmentId: parsePositiveInteger(input.installmentId, 'installmentId'),
  };
}
