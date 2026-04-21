import { NotFoundError } from '../../../shared/application/errors';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { GetInstallmentByIdQueryInput } from '../dto/GetInstallmentByIdQuery';
import { normalizeGetInstallmentByIdQuery } from '../dto/GetInstallmentByIdQuery';
import type { InstallmentDetailDto } from '../dto/InstallmentDetailDto';
import type { InstallmentQueryRepository } from '../ports/InstallmentQueryRepository';

export class GetInstallmentByIdUseCase {
  public constructor(private readonly installmentQueryRepository: InstallmentQueryRepository) {}

  public async execute(input: GetInstallmentByIdQueryInput): Promise<InstallmentDetailDto> {
    const query = normalizeGetInstallmentByIdQuery(input);
    const installment = await this.installmentQueryRepository.getById(query);

    if (!installment) {
      throw new NotFoundError({
        message: 'Installment not found',
        code: ErrorCode.RESOURCE_NOT_FOUND,
        details: {
          transactionId: query.transactionId,
          installmentId: query.installmentId,
        },
      });
    }

    return installment;
  }
}
