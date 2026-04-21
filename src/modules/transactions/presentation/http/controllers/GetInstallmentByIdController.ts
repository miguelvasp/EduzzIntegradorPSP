import type { FastifyReply, FastifyRequest } from 'fastify';
import { GetInstallmentByIdUseCase } from '../../../application/use-cases/GetInstallmentByIdUseCase';
import { InstallmentDetailHttpMapper } from '../mappers/InstallmentDetailHttpMapper';

type GetInstallmentByIdRequest = FastifyRequest<{
  Params: {
    transactionId: number | string;
    installmentId: number | string;
  };
}>;

export class GetInstallmentByIdController {
  public constructor(
    private readonly getInstallmentByIdUseCase: GetInstallmentByIdUseCase,
    private readonly installmentDetailHttpMapper: InstallmentDetailHttpMapper,
  ) {}

  public async handle(request: GetInstallmentByIdRequest, reply: FastifyReply): Promise<void> {
    const response = await this.getInstallmentByIdUseCase.execute({
      transactionId: request.params.transactionId,
      installmentId: request.params.installmentId,
    });

    reply.status(200).send(this.installmentDetailHttpMapper.map(response));
  }
}
