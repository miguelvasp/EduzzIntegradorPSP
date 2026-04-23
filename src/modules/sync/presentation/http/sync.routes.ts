import type { FastifyInstance } from 'fastify';
import { buildContainer } from '../../../../app/container';
import { RunIncrementalSyncController } from './controllers/RunIncrementalSyncController';
import { RunSyncController } from './controllers/RunSyncController';
import { SyncExecutionHttpMapper } from './sync.presenters';
import { runIncrementalSyncSchema, runSyncSchema } from './sync.schemas';

export async function registerSyncRoutes(app: FastifyInstance): Promise<void> {
  const { syncExecutionFactory, runSyncUseCase, runIncrementalSyncUseCase } =
    await buildContainer();

  const syncExecutionHttpMapper = new SyncExecutionHttpMapper();

  const runSyncController = new RunSyncController(
    syncExecutionFactory,
    runSyncUseCase,
    syncExecutionHttpMapper,
  );

  const runIncrementalSyncController = new RunIncrementalSyncController(
    syncExecutionFactory,
    runIncrementalSyncUseCase,
    syncExecutionHttpMapper,
  );

  app.post('/sync', { schema: runSyncSchema }, async (request, reply) =>
    runSyncController.handle(request as never, reply as never),
  );

  app.post('/sync/incremental', { schema: runIncrementalSyncSchema }, async (request, reply) =>
    runIncrementalSyncController.handle(request as never, reply as never),
  );
}
