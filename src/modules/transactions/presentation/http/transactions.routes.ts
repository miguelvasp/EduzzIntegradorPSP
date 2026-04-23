import type { FastifyInstance } from 'fastify';
import { buildContainer } from '../../../../app/container/index';
import { GetInstallmentByIdUseCase } from '../../application/use-cases/GetInstallmentByIdUseCase';
import { GetTransactionByIdUseCase } from '../../application/use-cases/GetTransactionByIdUseCase';
import { GetTransactionPayerUseCase } from '../../application/use-cases/GetTransactionPayerUseCase';
import { ListTransactionInstallmentsUseCase } from '../../application/use-cases/ListTransactionInstallmentsUseCase';
import { ListTransactionsUseCase } from '../../application/use-cases/ListTransactionsUseCase';
import { SqlServerInstallmentQueryRepository } from '../../infrastructure/persistence/repositories/SqlServerInstallmentQueryRepository';
import { SqlServerTransactionQueryRepository } from '../../infrastructure/persistence/repositories/SqlServerTransactionQueryRepository';
import { GetInstallmentByIdController } from './controllers/GetInstallmentByIdController';
import { GetTransactionByIdController } from './controllers/GetTransactionByIdController';
import { GetTransactionPayerController } from './controllers/GetTransactionPayerController';
import { ListTransactionInstallmentsController } from './controllers/ListTransactionInstallmentsController';
import { ListTransactionsController } from './controllers/ListTransactionsController';
import {
  InstallmentDetailHttpMapper,
  TransactionDetailHttpMapper,
  TransactionInstallmentHttpMapper,
  TransactionListHttpMapper,
  TransactionPayerHttpMapper,
} from './transactions.presenters';
import {
  getInstallmentByIdSchema,
  getInstallmentByStandaloneIdSchema,
  getTransactionByIdSchema,
  getTransactionPayerSchema,
  listTransactionInstallmentsSchema,
  listTransactionsSchema,
} from './transactions.schemas';

export async function registerTransactionRoutes(app: FastifyInstance): Promise<void> {
  const { persistence } = await buildContainer();

  const transactionQueryRepository =
    persistence.transactionQueryRepository ?? new SqlServerTransactionQueryRepository();

  const installmentQueryRepository =
    persistence.installmentQueryRepository ?? new SqlServerInstallmentQueryRepository();

  const listTransactionsController = new ListTransactionsController(
    new ListTransactionsUseCase(transactionQueryRepository),
    new TransactionListHttpMapper(),
  );

  const getTransactionByIdController = new GetTransactionByIdController(
    new GetTransactionByIdUseCase(transactionQueryRepository),
    new TransactionDetailHttpMapper(),
  );

  const listTransactionInstallmentsController = new ListTransactionInstallmentsController(
    new ListTransactionInstallmentsUseCase(installmentQueryRepository),
    new TransactionInstallmentHttpMapper(),
  );

  const getInstallmentByIdController = new GetInstallmentByIdController(
    new GetInstallmentByIdUseCase(installmentQueryRepository),
    new InstallmentDetailHttpMapper(),
  );

  const getTransactionPayerController = new GetTransactionPayerController(
    new GetTransactionPayerUseCase(transactionQueryRepository),
    new TransactionPayerHttpMapper(),
  );

  app.get('/transactions', { schema: listTransactionsSchema }, async (request, reply) =>
    listTransactionsController.handle(request as never, reply as never),
  );

  app.get('/transactions/:id', { schema: getTransactionByIdSchema }, async (request, reply) =>
    getTransactionByIdController.handle(request as never, reply as never),
  );

  app.get(
    '/transactions/:id/installments',
    { schema: listTransactionInstallmentsSchema },
    async (request, reply) =>
      listTransactionInstallmentsController.handle(request as never, reply as never),
  );

  app.get(
    '/transactions/:transactionId/installments/:installmentId',
    { schema: getInstallmentByIdSchema },
    async (request, reply) => getInstallmentByIdController.handle(request as never, reply as never),
  );

  app.get(
    '/installments/:id',
    { schema: getInstallmentByStandaloneIdSchema },
    async (request, reply) => getInstallmentByIdController.handle(request as never, reply as never),
  );

  app.get(
    '/transactions/:transactionId/payer',
    { schema: getTransactionPayerSchema },
    async (request, reply) =>
      getTransactionPayerController.handle(request as never, reply as never),
  );
}
