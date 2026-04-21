import { ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type ListTransactionsQueryInput = {
  startDate?: string;
  endDate?: string;
  status?: string;
  psp?: string;
  payerDocument?: string;
  page?: number;
  limit?: number;
};

export type ListTransactionsQuery = {
  startDate?: string;
  endDate?: string;
  status?: string;
  psp?: string;
  payerDocument?: string;
  page: number;
  limit: number;
};

export function normalizeListTransactionsQuery(
  input: ListTransactionsQueryInput,
): ListTransactionsQuery {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  if (!Number.isInteger(page) || page <= 0) {
    throw new ValidationError({
      message: 'Invalid page parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'page',
        value: page,
      },
    });
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new ValidationError({
      message: 'Invalid limit parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'limit',
        value: limit,
      },
    });
  }

  if (input.startDate && Number.isNaN(new Date(input.startDate).getTime())) {
    throw new ValidationError({
      message: 'Invalid startDate parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'startDate',
        value: input.startDate,
      },
    });
  }

  if (input.endDate && Number.isNaN(new Date(input.endDate).getTime())) {
    throw new ValidationError({
      message: 'Invalid endDate parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'endDate',
        value: input.endDate,
      },
    });
  }

  if (
    input.startDate &&
    input.endDate &&
    new Date(input.startDate).getTime() > new Date(input.endDate).getTime()
  ) {
    throw new ValidationError({
      message: 'startDate cannot be greater than endDate',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'dateRange',
      },
    });
  }

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    psp: input.psp,
    payerDocument: input.payerDocument,
    page,
    limit,
  };
}
