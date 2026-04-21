import type { FastifyReply, FastifyRequest } from 'fastify';
import { ListTransactionInstallmentsUseCase } from '../../../application/use-cases/ListTransactionInstallmentsUseCase';
import { TransactionInstallmentHttpMapper } from '../mappers/TransactionInstallmentHttpMapper';

type ListTransactionInstallmentsRequest = FastifyRequest<{
  Params: {
    id: number | string;
  };
}>;

export class ListTransactionInstallmentsController {
  public constructor(
    private readonly listTransactionInstallmentsUseCase: ListTransactionInstallmentsUseCase,
    private readonly transactionInstallmentHttpMapper: TransactionInstallmentHttpMapper,
  ) {}

  public async handle(
    request: ListTransactionInstallmentsRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const response = await this.listTransactionInstallmentsUseCase.execute({
      transactionId: request.params.id,
    });

    reply.status(200).send(this.transactionInstallmentHttpMapper.map(response));
  }
}
