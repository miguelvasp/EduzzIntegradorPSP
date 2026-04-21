import type { FastifyReply, FastifyRequest } from 'fastify';
import { GetTransactionPayerUseCase } from '../../../application/use-cases/GetTransactionPayerUseCase';
import { TransactionPayerHttpMapper } from '../mappers/TransactionPayerHttpMapper';

type GetTransactionPayerRequest = FastifyRequest<{
  Params: {
    transactionId: number | string;
  };
}>;

export class GetTransactionPayerController {
  public constructor(
    private readonly getTransactionPayerUseCase: GetTransactionPayerUseCase,
    private readonly transactionPayerHttpMapper: TransactionPayerHttpMapper,
  ) {}

  public async handle(request: GetTransactionPayerRequest, reply: FastifyReply): Promise<void> {
    const response = await this.getTransactionPayerUseCase.execute({
      transactionId: request.params.transactionId,
    });

    reply.status(200).send(this.transactionPayerHttpMapper.map(response));
  }
}
