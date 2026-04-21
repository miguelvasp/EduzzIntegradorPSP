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

  it('deve executar sync incremental para PSP específico', async () => {
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

    const result = await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
      }),
    );

    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(checkpointRepository.getByPsp).toHaveBeenCalledWith(PspType.PAGARME);
    expect(checkpointRepository.save).toHaveBeenCalledTimes(1);
    expect(result.targetPsps).toEqual([PspType.PAGARME]);
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
});
