import { describe, expect, it, vi } from 'vitest';
import { runSyncCli } from '../../app/cli/sync.cli';
import { PspType } from '../../modules/shared/domain/enums/pspType';

describe('runSyncCli', () => {
  it('deve chamar parser e use case e retornar 0 em caso de sucesso', async () => {
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

    const useCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
    };

    const result = await runSyncCli(['node', 'sync.cli.js', '--psp', 'pagarme'], {
      parser: parser as never,
      useCase: useCase as never,
    });

    expect(parser.parse).toHaveBeenCalledWith(['node', 'sync.cli.js', '--psp', 'pagarme']);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(result).toBe(0);
  });

  it('deve retornar 1 em caso de falha', async () => {
    const parser = {
      parse: vi.fn().mockImplementation(() => {
        throw new Error('invalid args');
      }),
    };

    const useCase = {
      execute: vi.fn(),
    };

    const result = await runSyncCli(['node', 'sync.cli.js', '--psp', 'abc'], {
      parser: parser as never,
      useCase: useCase as never,
    });

    expect(result).toBe(1);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('deve construir contexto com mode verbose quando flag estiver ativa', async () => {
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

    const useCase = {
      execute: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
    };

    await runSyncCli(['node', 'sync.cli.js', '--psp', 'mercado_pago', '--verbose'], {
      parser: parser as never,
      useCase: useCase as never,
    });

    expect(useCase.execute).toHaveBeenCalledTimes(1);

    const context = useCase.execute.mock.calls[0][0];

    expect(context.triggeredBy).toBe('cli');
    expect(context.targetPsp).toBe(PspType.MERCADO_PAGO);
    expect(context.mode).toBe('verbose');
    expect(context.verbose).toBe(true);
    expect(context.pageLimit).toBe(2);
    expect(context.itemLimit).toBe(10);
    expect(context.dryRun).toBe(true);
    expect(context.syncRunId).toBeTruthy();
    expect(context.correlationId).toBeTruthy();
  });
});
