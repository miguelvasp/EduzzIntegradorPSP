import { NotFoundError, ValidationError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { InstallmentDetailDto } from '../dto/InstallmentDetailDto';
import type { InstallmentQueryRepository } from '../ports/InstallmentQueryRepository';

type GetInstallmentByIdUseCaseInput = {
  id?: number | string;
  transactionId?: number | string;
  installmentId?: number | string;
};

type NormalizedGetInstallmentByIdQuery = {
  installmentId: number;
  transactionId?: number;
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

function normalizeGetInstallmentByIdQuery(
  input: GetInstallmentByIdUseCaseInput,
): NormalizedGetInstallmentByIdQuery {
  const rawInstallmentId = input.installmentId ?? input.id;

  if (rawInstallmentId === undefined || rawInstallmentId === null) {
    throw new ValidationError({
      message: 'Invalid installmentId parameter',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: 'installmentId',
        value: rawInstallmentId,
      },
    });
  }

  return {
    installmentId: parsePositiveInteger(rawInstallmentId, 'installmentId'),
    transactionId:
      input.transactionId === undefined || input.transactionId === null
        ? undefined
        : parsePositiveInteger(input.transactionId, 'transactionId'),
  };
}

export class GetInstallmentByIdUseCase {
  public constructor(private readonly installmentQueryRepository: InstallmentQueryRepository) {}

  public async execute(input: GetInstallmentByIdUseCaseInput): Promise<InstallmentDetailDto> {
    const query = normalizeGetInstallmentByIdQuery(input);
    const installment = await this.installmentQueryRepository.getById(query);

    if (!installment) {
      throw new NotFoundError({
        message: 'Installment not found',
        code: ErrorCode.RESOURCE_NOT_FOUND,
        details:
          typeof query.transactionId === 'number'
            ? {
                transactionId: query.transactionId,
                installmentId: query.installmentId,
              }
            : {
                installmentId: query.installmentId,
              },
      });
    }

    return installment;
  }
}
