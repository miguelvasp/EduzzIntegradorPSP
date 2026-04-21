import type { FastifyReply, FastifyRequest } from 'fastify';
import { ListTransactionsUseCase } from '../../../application/use-cases/ListTransactionsUseCase';
import { TransactionListHttpMapper } from '../mappers/TransactionListHttpMapper';

type ListTransactionsRequest = FastifyRequest<{
  Querystring: {
    startDate?: string;
    endDate?: string;
    status?: string;
    psp?: string;
    payerDocument?: string;
    page?: number;
    limit?: number;
  };
}>;

export class ListTransactionsController {
  public constructor(
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly transactionListHttpMapper: TransactionListHttpMapper,
  ) {}

  public async handle(request: ListTransactionsRequest, reply: FastifyReply): Promise<void> {
    const response = await this.listTransactionsUseCase.execute({
      startDate: request.query.startDate,
      endDate: request.query.endDate,
      status: request.query.status,
      psp: request.query.psp,
      payerDocument: request.query.payerDocument,
      page: request.query.page,
      limit: request.query.limit,
    });

    reply.status(200).send(this.transactionListHttpMapper.map(response));
  }
}
