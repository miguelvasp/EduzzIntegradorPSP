import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { SyncPageProcessor } from '../../modules/sync/application/services/SyncPageProcessor';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';
import { RunSyncUseCase } from '../../modules/sync/application/use-cases/RunSyncUseCase';

describe('RunSyncUseCase', () => {
  function createContext(overrides?: Partial<Parameters<RunSyncUseCase['execute']>[0]>) {
    return {
      syncRunId: 'sync-run-1',
      correlationId: 'corr-1',
      triggeredBy: 'cli' as const,
      targetPsp: undefined,
      startedAt: new Date('2026-04-21T10:00:00.000Z'),
      mode: 'standard' as const,
      verbose: false,
      pageLimit: undefined,
      itemLimit: 20,
      dryRun: false,
      ...overrides,
    };
  }

  it('deve executar um PSP específico e fechar lifecycle', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: 'or_1' }],
        pagination: {},
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const syncRunLifecycleService = {
      startRun: vi.fn().mockImplementation(async (context) => ({
        ...context,
        syncRunDbId: 100,
      })),
      completeRun: vi.fn().mockResolvedValue(undefined),
      startSource: vi.fn().mockResolvedValue(200),
      completeSource: vi.fn().mockResolvedValue(undefined),
      startPage: vi.fn().mockResolvedValue(300),
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

    const useCase = new RunSyncUseCase(
      strategyFactory as never,
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
    expect(result.targetPsps).toEqual([PspType.PAGARME]);
    expect(result.syncRunDbId).toBe(100);
    expect(result.pagesProcessed).toBe(1);
    expect(result.itemsRead).toBe(1);
    expect(result.status).toBe('completed');
  });

  it('deve executar todos os PSPs quando targetPsp não for informado', async () => {
    const pagarmeStrategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: 'or_1' }],
        pagination: {},
      }),
      adapt: vi.fn(),
    };

    const mercadoPagoStrategy = {
      getPsp: vi.fn().mockReturnValue(PspType.MERCADO_PAGO),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: 'mp_1' }, { id: 'mp_2' }],
        pagination: {},
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn((psp: PspType) => {
        return psp === PspType.PAGARME ? pagarmeStrategy : mercadoPagoStrategy;
      }),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const syncRunLifecycleService = {
      startRun: vi.fn().mockImplementation(async (context) => ({
        ...context,
        syncRunDbId: 100,
      })),
      completeRun: vi.fn().mockResolvedValue(undefined),
      startSource: vi.fn().mockResolvedValueOnce(201).mockResolvedValueOnce(202),
      completeSource: vi.fn().mockResolvedValue(undefined),
      startPage: vi.fn().mockResolvedValueOnce(301).mockResolvedValueOnce(302),
      completePage: vi.fn().mockResolvedValue(undefined),
      calculateSourceCounters: vi
        .fn()
        .mockReturnValueOnce({
          itemsRead: 1,
          itemsProcessed: 1,
          itemsSucceeded: 1,
          itemsFailed: 0,
        })
        .mockReturnValueOnce({
          itemsRead: 2,
          itemsProcessed: 2,
          itemsSucceeded: 2,
          itemsFailed: 0,
        }),
      calculatePageCounters: vi
        .fn()
        .mockReturnValueOnce({
          itemsRead: 1,
          itemsProcessed: 1,
        })
        .mockReturnValueOnce({
          itemsRead: 2,
          itemsProcessed: 2,
        }),
    };

    const useCase = new RunSyncUseCase(
      strategyFactory as never,
      syncPageProcessor,
      progressTracker,
      syncRunLifecycleService as never,
    );

    const result = await useCase.execute(createContext());

    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.MERCADO_PAGO);
    expect(syncRunLifecycleService.completeRun).toHaveBeenCalledTimes(1);
    expect(result.targetPsps).toEqual([PspType.PAGARME, PspType.MERCADO_PAGO]);
    expect(result.pagesProcessed).toBe(2);
    expect(result.itemsRead).toBe(3);
    expect(result.status).toBe('completed');
  });

  it('deve respeitar dryRun sem adaptar itens', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockResolvedValue({
        items: [{ id: 'or_1' }],
        pagination: {},
      }),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const useCase = new RunSyncUseCase(
      strategyFactory as never,
      syncPageProcessor,
      progressTracker,
    );

    const result = await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
        dryRun: true,
      }),
    );

    expect(strategy.adapt).not.toHaveBeenCalled();
    expect(result.status).toBe('completed');
  });

  it('deve propagar falha controlada da factory', async () => {
    const strategyFactory = {
      resolve: vi.fn().mockImplementation(() => {
        throw new Error('unsupported psp');
      }),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const useCase = new RunSyncUseCase(
      strategyFactory as never,
      syncPageProcessor,
      progressTracker,
    );

    await expect(
      useCase.execute(
        createContext({
          targetPsp: PspType.PAGARME,
        }),
      ),
    ).rejects.toThrow('unsupported psp');
  });

  it('deve fechar run como failed quando houver falha de item não tratada no nível superior', async () => {
    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      listPage: vi.fn().mockRejectedValue(new Error('upstream fatal failure')),
      adapt: vi.fn(),
    };

    const strategyFactory = {
      resolve: vi.fn().mockReturnValue(strategy),
    };

    const progressTracker = new SyncProgressTracker();
    const syncPageProcessor = new SyncPageProcessor(progressTracker);
    const syncRunLifecycleService = {
      startRun: vi.fn().mockImplementation(async (context) => ({
        ...context,
        syncRunDbId: 900,
      })),
      completeRun: vi.fn().mockResolvedValue(undefined),
      startSource: vi.fn().mockResolvedValue(901),
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

    const useCase = new RunSyncUseCase(
      strategyFactory as never,
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
    ).rejects.toThrow('upstream fatal failure');

    expect(syncRunLifecycleService.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorSummary: 'upstream fatal failure',
      }),
    );
  });
});
