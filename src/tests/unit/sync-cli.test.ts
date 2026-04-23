import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';

const buildContainerMock = vi.fn();

vi.mock('../../app/container', () => ({
  buildContainer: buildContainerMock,
}));

describe('runSyncCli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar parser, container e runSyncUseCase e retornar 0 em caso de sucesso', async () => {
    const parser = {
      parse: vi.fn().mockReturnValue({
        targetPsp: PspType.PAGARME,
        all: false,
        verbose: false,
        pageLimit: undefined,
        itemLimit: 20,
        dryRun: false,
      }),
    };

    const syncExecutionFactory = {
      create: vi.fn().mockReturnValue({
        syncRunId: 'sync-run-1',
        correlationId: 'corr-1',
        triggeredBy: 'cli',
        targetPsp: PspType.PAGARME,
        startedAt: new Date('2026-04-21T10:00:00.000Z'),
        mode: 'standard',
        verbose: false,
        pageLimit: undefined,
        itemLimit: 20,
        dryRun: false,
      }),
    };

    const runSyncUseCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
    };

    buildContainerMock.mockResolvedValue({
      syncExecutionFactory,
      runSyncUseCase,
      runIncrementalSyncUseCase: { execute: vi.fn() },
      persistence: {},
    });

    const { runSyncCli } = await import('../../app/cli/sync.cli.js');

    const result = await runSyncCli(['node', 'sync.cli.js', '--psp', 'pagarme'], {
      parser: parser as never,
    });

    expect(parser.parse).toHaveBeenCalledWith(['node', 'sync.cli.js', '--psp', 'pagarme']);
    expect(buildContainerMock).toHaveBeenCalledTimes(1);
    expect(syncExecutionFactory.create).toHaveBeenCalledWith({
      targetPsp: PspType.PAGARME,
      triggeredBy: 'cli',
      mode: 'standard',
      verbose: false,
      pageLimit: undefined,
      itemLimit: 20,
      dryRun: false,
    });
    expect(runSyncUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result).toBe(0);
  });

  it('deve propagar os parâmetros corretos da factory em modo verbose', async () => {
    const parser = {
      parse: vi.fn().mockReturnValue({
        targetPsp: PspType.MERCADO_PAGO,
        all: false,
        verbose: true,
        pageLimit: 2,
        itemLimit: 10,
        dryRun: true,
      }),
    };

    const createdContext = {
      syncRunId: 'sync-run-2',
      correlationId: 'corr-2',
      triggeredBy: 'cli',
      targetPsp: PspType.MERCADO_PAGO,
      startedAt: new Date('2026-04-21T10:00:00.000Z'),
      mode: 'verbose',
      verbose: true,
      pageLimit: 2,
      itemLimit: 10,
      dryRun: true,
    };

    const syncExecutionFactory = {
      create: vi.fn().mockReturnValue(createdContext),
    };

    const runSyncUseCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
    };

    buildContainerMock.mockResolvedValue({
      syncExecutionFactory,
      runSyncUseCase,
      runIncrementalSyncUseCase: { execute: vi.fn() },
      persistence: {},
    });

    const { runSyncCli } = await import('../../app/cli/sync.cli.js');

    const result = await runSyncCli(['node', 'sync.cli.js', '--psp', 'mercado_pago', '--verbose'], {
      parser: parser as never,
    });

    expect(syncExecutionFactory.create).toHaveBeenCalledWith({
      targetPsp: PspType.MERCADO_PAGO,
      triggeredBy: 'cli',
      mode: 'verbose',
      verbose: true,
      pageLimit: 2,
      itemLimit: 10,
      dryRun: true,
    });
    expect(runSyncUseCase.execute).toHaveBeenCalledWith(createdContext);
    expect(result).toBe(0);
  });

  it('deve retornar 1 em caso de falha', async () => {
    const parser = {
      parse: vi.fn().mockImplementation(() => {
        throw new Error('invalid args');
      }),
    };

    const { runSyncCli } = await import('../../app/cli/sync.cli.js');

    const result = await runSyncCli(['node', 'sync.cli.js', '--psp', 'abc'], {
      parser: parser as never,
    });

    expect(result).toBe(1);
    expect(buildContainerMock).not.toHaveBeenCalled();
  });
});
