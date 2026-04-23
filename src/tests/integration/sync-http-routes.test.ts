import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';

const buildContainerMock = vi.fn();

vi.mock('../../app/container', () => ({
  buildContainer: buildContainerMock,
}));

function createContainerMock() {
  return {
    persistence: {
      transactionQueryRepository: {} as never,
      installmentQueryRepository: {} as never,
      payerQueryRepository: {} as never,
    },
    syncExecutionFactory: {
      create: vi.fn((input) => ({
        syncRunId: 'sync-run-http-1',
        syncRunDbId: 101,
        correlationId: input.correlationId ?? 'corr-http-1',
        triggeredBy: input.triggeredBy,
        targetPsp: input.targetPsp,
        startedAt: new Date('2026-04-23T12:00:00.000Z'),
        mode: input.mode ?? 'standard',
        verbose: input.verbose ?? false,
        pageLimit: input.pageLimit,
        itemLimit: input.itemLimit,
        dryRun: input.dryRun ?? false,
      })),
    },
    runSyncUseCase: {
      execute: vi.fn().mockResolvedValue({
        syncRunId: 'sync-run-http-1',
        syncRunDbId: 101,
        correlationId: 'req-sync-1',
        startedAt: new Date('2026-04-23T12:00:00.000Z'),
        finishedAt: new Date('2026-04-23T12:00:03.000Z'),
        durationMs: 3000,
        mode: 'standard',
        targetPsps: [PspType.PAGARME],
        pagesProcessed: 1,
        itemsRead: 2,
        status: 'completed',
      }),
    },
    runIncrementalSyncUseCase: {
      execute: vi.fn().mockResolvedValue({
        syncRunId: 'sync-run-http-2',
        syncRunDbId: 102,
        correlationId: 'req-sync-2',
        startedAt: new Date('2026-04-23T12:10:00.000Z'),
        finishedAt: new Date('2026-04-23T12:10:02.000Z'),
        durationMs: 2000,
        mode: 'standard',
        targetPsps: [PspType.MERCADO_PAGO],
        pagesProcessed: 1,
        itemsRead: 3,
        status: 'completed',
      }),
    },
  };
}

describe('sync http routes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildContainerMock.mockResolvedValue(createContainerMock());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve executar POST /sync com PSP específico', async () => {
    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    await app.ready();

    const response = await request(app.server)
      .post('/sync')
      .set('x-request-id', 'req-sync-1')
      .send({
        psp: 'pagarme',
        pageLimit: 1,
        itemLimit: 20,
        dryRun: false,
        verbose: false,
      });

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-sync-1');
    expect(response.body).toEqual({
      syncRunId: 'sync-run-http-1',
      syncRunDbId: 101,
      correlationId: 'req-sync-1',
      status: 'completed',
      mode: 'standard',
      targetPsps: [PspType.PAGARME],
      startedAt: '2026-04-23T12:00:00.000Z',
      finishedAt: '2026-04-23T12:00:03.000Z',
      durationMs: 3000,
      pagesProcessed: 1,
      itemsRead: 2,
    });

    const container = await buildContainerMock.mock.results[0].value;
    expect(container.syncExecutionFactory.create).toHaveBeenCalledWith({
      correlationId: 'req-sync-1',
      triggeredBy: 'http',
      targetPsp: PspType.PAGARME,
      mode: 'standard',
      verbose: false,
      pageLimit: 1,
      itemLimit: 20,
      dryRun: false,
    });
    expect(container.runSyncUseCase.execute).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('deve executar POST /sync/incremental com PSP específico', async () => {
    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    await app.ready();

    const response = await request(app.server)
      .post('/sync/incremental')
      .set('x-request-id', 'req-sync-2')
      .send({
        psp: 'mercado_pago',
        pageLimit: 2,
        itemLimit: 10,
        dryRun: true,
        verbose: true,
      });

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-sync-2');
    expect(response.body).toEqual({
      syncRunId: 'sync-run-http-2',
      syncRunDbId: 102,
      correlationId: 'req-sync-2',
      status: 'completed',
      mode: 'standard',
      targetPsps: [PspType.MERCADO_PAGO],
      startedAt: '2026-04-23T12:10:00.000Z',
      finishedAt: '2026-04-23T12:10:02.000Z',
      durationMs: 2000,
      pagesProcessed: 1,
      itemsRead: 3,
    });

    const container = await buildContainerMock.mock.results[0].value;
    expect(container.syncExecutionFactory.create).toHaveBeenCalledWith({
      correlationId: 'req-sync-2',
      triggeredBy: 'http',
      targetPsp: PspType.MERCADO_PAGO,
      mode: 'verbose',
      verbose: true,
      pageLimit: 2,
      itemLimit: 10,
      dryRun: true,
    });
    expect(container.runIncrementalSyncUseCase.execute).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('deve aceitar POST /sync sem PSP e executar para todos', async () => {
    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    await app.ready();

    const response = await request(app.server)
      .post('/sync')
      .set('x-request-id', 'req-sync-3')
      .send({
        pageLimit: 1,
        itemLimit: 5,
        dryRun: false,
      });

    expect(response.status).toBe(200);

    const container = await buildContainerMock.mock.results[0].value;
    expect(container.syncExecutionFactory.create).toHaveBeenCalledWith({
      correlationId: 'req-sync-3',
      triggeredBy: 'http',
      targetPsp: undefined,
      mode: 'standard',
      verbose: false,
      pageLimit: 1,
      itemLimit: 5,
      dryRun: false,
    });

    await app.close();
  });

  it('deve retornar 400 para body inválido', async () => {
    const { createServer } = await import('../../app/server/createServer.js');
    const app = createServer();

    await app.ready();

    const response = await request(app.server)
      .post('/sync')
      .set('x-request-id', 'req-sync-4')
      .send({
        psp: 'psp_invalido',
      });

    expect(response.status).toBe(400);
    expect(response.headers['x-request-id']).toBe('req-sync-4');

    await app.close();
  });
});
