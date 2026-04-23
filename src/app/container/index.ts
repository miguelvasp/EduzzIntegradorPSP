import { PspStrategyFactory } from '../../modules/psp/infrastructure/factories/PspStrategyFactory';
import { SyncConflictRecorder } from '../../modules/sync/application/services/SyncConflictRecorder';
import { SyncExecutionFactory } from '../../modules/sync/application/services/SyncExecutionFactory';
import { SyncPageProcessor } from '../../modules/sync/application/services/SyncPageProcessor';
import { SyncPersistenceService } from '../../modules/sync/application/services/SyncPersistenceService';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';
import { SyncRejectionRecorder } from '../../modules/sync/application/services/SyncRejectionRecorder';
import { SyncRunLifecycleService } from '../../modules/sync/application/services/SyncRunLifecycleService';
import { RunIncrementalSyncUseCase } from '../../modules/sync/application/use-cases/RunIncrementalSyncUseCase';
import { RunSyncUseCase } from '../../modules/sync/application/use-cases/RunSyncUseCase';
import { SyncWindowCalculator } from '../../modules/sync/domain/SyncWindowCalculator';
import { createPspStrategies } from './createPspStrategies';
import { createSyncRepositories } from './createSyncRepositories';
import { registerPersistence, type PersistenceRegistry } from './registerPersistence';

export type AppContainer = {
  persistence: PersistenceRegistry;
  syncExecutionFactory: SyncExecutionFactory;
  runSyncUseCase: RunSyncUseCase;
  runIncrementalSyncUseCase: RunIncrementalSyncUseCase;
};

let container: AppContainer | null = null;

export async function buildContainer(): Promise<AppContainer> {
  if (container) {
    return container;
  }

  const persistence = await registerPersistence();
  const syncRepositories = createSyncRepositories();
  const strategies = createPspStrategies();
  const strategyFactory = new PspStrategyFactory(strategies);

  const syncPersistenceService = new SyncPersistenceService(
    persistence.unitOfWork,
    persistence.transactionPersistenceRepository,
    persistence.installmentPersistenceRepository,
    persistence.payerPersistenceRepository,
    persistence.syncCheckpointRepository,
    persistence.idempotencyRepository,
    persistence.outboxRepository,
    persistence.syncAuditRepository,
    persistence.transactionAuditRepository,
  );

  const syncRejectionRecorder = new SyncRejectionRecorder(
    syncRepositories.validationFailureRepository,
    syncRepositories.rejectedRecordRepository,
    persistence.syncAuditRepository,
  );

  const syncConflictRecorder = new SyncConflictRecorder(
    syncRepositories.dataConflictRepository,
    syncRepositories.reconciliationCaseRepository,
    persistence.syncAuditRepository,
  );

  const syncRunLifecycleService = new SyncRunLifecycleService(persistence.syncAuditRepository);

  const syncExecutionFactory = new SyncExecutionFactory();

  const createSyncPageProcessor = (progressTracker: SyncProgressTracker): SyncPageProcessor => {
    return new SyncPageProcessor(
      progressTracker,
      syncPersistenceService,
      syncRejectionRecorder,
      syncConflictRecorder,
    );
  };

  const createRunSyncUseCase = (): RunSyncUseCase => {
    const progressTracker = new SyncProgressTracker();

    return new RunSyncUseCase(
      strategyFactory,
      createSyncPageProcessor(progressTracker),
      progressTracker,
      syncRunLifecycleService,
    );
  };

  const createRunIncrementalSyncUseCase = (): RunIncrementalSyncUseCase => {
    const progressTracker = new SyncProgressTracker();

    return new RunIncrementalSyncUseCase(
      strategyFactory,
      persistence.syncCheckpointRepository,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      createSyncPageProcessor(progressTracker),
      progressTracker,
      syncRunLifecycleService,
    );
  };

  container = {
    persistence,
    syncExecutionFactory,
    runSyncUseCase: createRunSyncUseCase(),
    runIncrementalSyncUseCase: createRunIncrementalSyncUseCase(),
  };

  return container;
}
