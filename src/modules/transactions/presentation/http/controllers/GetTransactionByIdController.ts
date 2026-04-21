import type { FastifyReply, FastifyRequest } from 'fastify';
import { GetTransactionByIdUseCase } from '../../../application/use-cases/GetTransactionByIdUseCase';
import { TransactionDetailHttpMapper } from '../mappers/TransactionDetailHttpMapper';

type GetTransactionByIdRequest = FastifyRequest<{
  Params: {
    id: number | string;
  };
}>;

export class GetTransactionByIdController {
  public constructor(
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly transactionDetailHttpMapper: TransactionDetailHttpMapper,
  ) {}

  public async handle(request: GetTransactionByIdRequest, reply: FastifyReply): Promise<void> {
    const response = await this.getTransactionByIdUseCase.execute({
      id: request.params.id,
    });

    reply.status(200).send(this.transactionDetailHttpMapper.map(response));
  }
}
