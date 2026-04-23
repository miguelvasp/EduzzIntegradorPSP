import { SqlServerInboxRepository } from '../../modules/outbox/infrastructure/persistence/SqlServerInboxRepository';
import { SqlServerOutboxRepository } from '../../modules/outbox/infrastructure/persistence/SqlServerOutboxRepository';
import { SqlServerUnitOfWork } from '../../modules/outbox/infrastructure/persistence/SqlServerUnitOfWork';
import { bootstrapSqlServerSchema } from '../../modules/shared/infrastructure/persistence/SqlServerSchemaBootstrap';
import { SqlServerIdempotencyRepository } from '../../modules/sync/infrastructure/persistence/repositories/SqlServerIdempotencyRepository';
import { SqlServerSyncAuditRepository } from '../../modules/sync/infrastructure/persistence/repositories/SqlServerSyncAuditRepository';
import { SqlServerSyncCheckpointRepository } from '../../modules/sync/infrastructure/persistence/repositories/SqlServerSyncCheckpointRepository';
import { SqlServerInstallmentPersistenceRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerInstallmentPersistenceRepository';
import { SqlServerInstallmentQueryRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerInstallmentQueryRepository';
import { SqlServerPayerPersistenceRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerPayerPersistenceRepository';
import { SqlServerPayerQueryRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerPayerQueryRepository';
import { SqlServerTransactionAuditRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerTransactionAuditRepository';
import { SqlServerTransactionPersistenceRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerTransactionPersistenceRepository';
import { SqlServerTransactionQueryRepository } from '../../modules/transactions/infrastructure/persistence/repositories/SqlServerTransactionQueryRepository';
import { appLogger } from '../server/logging';

export type PersistenceRegistry = {
  unitOfWork: SqlServerUnitOfWork;
  syncAuditRepository: SqlServerSyncAuditRepository;
  syncCheckpointRepository: SqlServerSyncCheckpointRepository;
  transactionPersistenceRepository: SqlServerTransactionPersistenceRepository;
  transactionAuditRepository: SqlServerTransactionAuditRepository;
  installmentPersistenceRepository: SqlServerInstallmentPersistenceRepository;
  payerPersistenceRepository: SqlServerPayerPersistenceRepository;
  idempotencyRepository: SqlServerIdempotencyRepository;
  outboxRepository: SqlServerOutboxRepository;
  inboxRepository: SqlServerInboxRepository;
  transactionQueryRepository: SqlServerTransactionQueryRepository;
  installmentQueryRepository: SqlServerInstallmentQueryRepository;
  payerQueryRepository: SqlServerPayerQueryRepository;
};

let registry: PersistenceRegistry | null = null;

export async function registerPersistence(): Promise<PersistenceRegistry> {
  if (registry) {
    return registry;
  }

  await bootstrapSqlServerSchema();

  const transactionPersistenceRepository = new SqlServerTransactionPersistenceRepository();
  const transactionQueryRepository = new SqlServerTransactionQueryRepository();

  registry = {
    unitOfWork: new SqlServerUnitOfWork(),
    syncAuditRepository: new SqlServerSyncAuditRepository(),
    syncCheckpointRepository: new SqlServerSyncCheckpointRepository(),
    transactionPersistenceRepository,
    transactionAuditRepository: new SqlServerTransactionAuditRepository(),
    installmentPersistenceRepository: new SqlServerInstallmentPersistenceRepository(),
    payerPersistenceRepository: new SqlServerPayerPersistenceRepository(),
    idempotencyRepository: new SqlServerIdempotencyRepository(transactionPersistenceRepository),
    outboxRepository: new SqlServerOutboxRepository(),
    inboxRepository: new SqlServerInboxRepository(),
    transactionQueryRepository,
    installmentQueryRepository: new SqlServerInstallmentQueryRepository(),
    payerQueryRepository: new SqlServerPayerQueryRepository(),
  };

  appLogger.info({
    eventType: 'startup',
    message: 'SQL Server persistence registered',
    status: 'completed',
    module: 'persistence',
    component: 'container',
  });

  return registry;
}
