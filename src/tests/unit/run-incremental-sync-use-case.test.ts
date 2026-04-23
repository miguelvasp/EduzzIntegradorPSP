import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { SyncPageProcessor } from '../../modules/sync/application/services/SyncPageProcessor';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';
import { RunIncrementalSyncUseCase } from '../../modules/sync/application/use-cases/RunIncrementalSyncUseCase';
import { SyncWindowCalculator } from '../../modules/sync/domain/SyncWindowCalculator';

describe('RunIncrementalSyncUseCase', () => {
  function createContext(overrides?: Record<string, unknown>) {
    return {
      syncRunId: 'sync-run-1',
      correlationId: 'corr-1',
      triggeredBy: 'cli' as const,
      targetPsp: undefined,
      startedAt: new Date('2026-04-21T10:00:00.000Z'),
      mode: 'standard' as const,
      verbose: false,
      pageLimit: 2,
      itemLimit: 2,
      dryRun: false,
      ...overrides,
    };
  }

  it('deve executar sync incremental para PSP específico com lifecycle', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: '1' }],
        pagination: {
          hasMore: false,
        },
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const checkpointRepository = {
      getByPsp: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const syncRunLifecycleService = {
      startRun: vi.fn().mockImplementation(async (context) => ({
        ...context,
        syncRunDbId: 111,
      })),
      completeRun: vi.fn().mockResolvedValue(undefined),
      startSource: vi.fn().mockResolvedValue(222),
      completeSource: vi.fn().mockResolvedValue(undefined),
      startPage: vi.fn().mockResolvedValue(333),
      completePage: vi.fn().mockResolvedValue(undefined),
      calculateSourceCounters: vi.fn().mockReturnValue({
        itemsRead: 1,
        itemsProcessed: 1,
        itemsSucceeded: 1,
        itemsFailed: 0,
      }),
      calculatePageCounters: vi.fn().mockReturnValue({
        itemsRead: 1,
        itemsProcessed: 1,
      }),
    };

    const useCase = new RunIncrementalSyncUseCase(
      strategyFactory as never,
      checkpointRepository as never,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      syncPageProcessor,
      progressTracker,
      syncRunLifecycleService as never,
    );

    const result = await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
      }),
    );

    expect(syncRunLifecycleService.startRun).toHaveBeenCalledTimes(1);
    expect(syncRunLifecycleService.startSource).toHaveBeenCalledTimes(1);
    expect(syncRunLifecycleService.startPage).toHaveBeenCalledTimes(1);
    expect(syncRunLifecycleService.completePage).toHaveBeenCalledTimes(1);
    expect(syncRunLifecycleService.completeSource).toHaveBeenCalledTimes(1);
    expect(syncRunLifecycleService.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      }),
    );
    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(checkpointRepository.getByPsp).toHaveBeenCalledWith(PspType.PAGARME);
    expect(checkpointRepository.save).toHaveBeenCalledTimes(1);
    expect(result.targetPsps).toEqual([PspType.PAGARME]);
    expect(result.syncRunDbId).toBe(111);
    expect(result.pagesProcessed).toBe(1);
    expect(result.itemsRead).toBe(1);
  });

  it('deve executar sync incremental para todos PSPs', async () => {
    const pagarmeStrategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: '1' }],
        pagination: {
          hasMore: false,
        },
      }),
      adapt: vi.fn(),
    };

    const mercadoPagoStrategy = {
      getPsp: vi.fn().mockReturnValue(PspType.MERCADO_PAGO),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: '2' }, { id: '3' }],
        pagination: {
          hasMore: false,
          limit: 2,
        },
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn((psp: PspType) => {
        return psp === PspType.PAGARME ? pagarmeStrategy : mercadoPagoStrategy;
      }),
    };

    const checkpointRepository = {
      getByPsp: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const useCase = new RunIncrementalSyncUseCase(
      strategyFactory as never,
      checkpointRepository as never,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      syncPageProcessor,
      progressTracker,
    );

    const result = await useCase.execute(createContext());

    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.MERCADO_PAGO);
    expect(checkpointRepository.save).toHaveBeenCalledTimes(2);
    expect(result.targetPsps).toEqual([PspType.PAGARME, PspType.MERCADO_PAGO]);
    expect(result.pagesProcessed).toBe(2);
    expect(result.itemsRead).toBe(3);
  });

  it('deve respeitar pageLimit e parar mesmo com hasMore', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: '1' }],
        pagination: {
          hasMore: true,
        },
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const checkpointRepository = {
      getByPsp: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);

    const useCase = new RunIncrementalSyncUseCase(
      strategyFactory as never,
      checkpointRepository as never,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      syncPageProcessor,
      progressTracker,
    );

    const result = await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
        pageLimit: 2,
      }),
    );

    expect(strategy.listPage).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
  });

  it('deve respeitar dryRun sem adaptar itens', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: '1' }],
        pagination: {
          hasMore: false,
        },
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const checkpointRepository = {
      getByPsp: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);

    const useCase = new RunIncrementalSyncUseCase(
      strategyFactory as never,
      checkpointRepository as never,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      syncPageProcessor,
      progressTracker,
    );

    await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
        dryRun: true,
      }),
    );

    expect(strategy.adapt).not.toHaveBeenCalled();
  });

  it('deve fechar run incremental como failed quando houver falha fatal', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockRejectedValue(new Error('incremental upstream fatal failure')),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const checkpointRepository = {
      getByPsp: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const syncRunLifecycleService = {
      startRun: vi.fn().mockImplementation(async (context) => ({
        ...context,
        syncRunDbId: 444,
      })),
      completeRun: vi.fn().mockResolvedValue(undefined),
      startSource: vi.fn().mockResolvedValue(555),
      completeSource: vi.fn().mockResolvedValue(undefined),
      startPage: vi.fn(),
      completePage: vi.fn(),
      calculateSourceCounters: vi.fn().mockReturnValue({
        itemsRead: 0,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 0,
      }),
      calculatePageCounters: vi.fn().mockReturnValue({
        itemsRead: 0,
        itemsProcessed: 0,
      }),
    };

    const useCase = new RunIncrementalSyncUseCase(
      strategyFactory as never,
      checkpointRepository as never,
      new SyncWindowCalculator({
        initialLookbackMinutes: 60,
        overlapMinutes: 15,
      }),
      syncPageProcessor,
      progressTracker,
      syncRunLifecycleService as never,
    );

    await expect(
      useCase.execute(
        createContext({
          targetPsp: PspType.PAGARME,
        }),
      ),
    ).rejects.toThrow('incremental upstream fatal failure');

    expect(syncRunLifecycleService.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorSummary: 'incremental upstream fatal failure',
      }),
    );
  });
});
