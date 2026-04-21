import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
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

  it('deve executar um PSP específico', async () => {
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

    const useCase = new RunSyncUseCase(strategyFactory as never);

    const result = await useCase.execute(
      createContext({
        targetPsp: PspType.PAGARME,
      }),
    );

    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(strategy.listPage).toHaveBeenCalledTimes(1);
    expect(strategy.adapt).toHaveBeenCalledTimes(1);
    expect(result.targetPsps).toEqual([PspType.PAGARME]);
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

    const useCase = new RunSyncUseCase(strategyFactory as never);

    const result = await useCase.execute(createContext());

    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.PAGARME);
    expect(strategyFactory.resolve).toHaveBeenCalledWith(PspType.MERCADO_PAGO);
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

    const useCase = new RunSyncUseCase(strategyFactory as never);

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

    const useCase = new RunSyncUseCase(strategyFactory as never);

    await expect(
      useCase.execute(
        createContext({
          targetPsp: PspType.PAGARME,
        }),
      ),
    ).rejects.toThrow('unsupported psp');
  });
});
