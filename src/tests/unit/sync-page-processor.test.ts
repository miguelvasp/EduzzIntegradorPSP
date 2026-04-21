import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import type { SyncExecutionContext } from '../../modules/sync/application/dto/SyncExecutionContext';
import { SyncPageProcessor } from '../../modules/sync/application/services/SyncPageProcessor';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';

describe('SyncPageProcessor', () => {
  function createContext(): SyncExecutionContext {
    return {
      syncRunId: 'sync-run-1',
      correlationId: 'corr-1',
      triggeredBy: 'cli',
      targetPsp: PspType.PAGARME,
      startedAt: new Date('2026-04-21T10:00:00.000Z'),
      mode: 'standard',
      verbose: false,
      pageLimit: 1,
      itemLimit: 20,
      dryRun: false,
    };
  }

  it('deve processar itens item a item', async () => {
    const tracker = new SyncProgressTracker();
    const processor = new SyncPageProcessor(tracker);

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi.fn(),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: '1' }, { id: '2' }],
      context: createContext(),
      dryRun: false,
    });

    expect(strategy.adapt).toHaveBeenCalledTimes(2);
    expect(tracker.getSnapshot()).toEqual({
      currentPsp: undefined,
      pagesProcessed: 0,
      itemsRead: 2,
      itemsProcessed: 2,
      itemsFailed: 0,
    });
  });

  it('deve respeitar dryRun sem adaptar itens', async () => {
    const tracker = new SyncProgressTracker();
    const processor = new SyncPageProcessor(tracker);

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi.fn(),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: '1' }],
      context: createContext(),
      dryRun: true,
    });

    expect(strategy.adapt).not.toHaveBeenCalled();
    expect(tracker.getSnapshot().itemsProcessed).toBe(1);
  });

  it('deve registrar falha de item sem interromper os demais', async () => {
    const tracker = new SyncProgressTracker();
    const processor = new SyncPageProcessor(tracker);

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('invalid item');
        })
        .mockImplementationOnce(() => undefined),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: '1' }, { id: '2' }],
      context: createContext(),
      dryRun: false,
    });

    expect(strategy.adapt).toHaveBeenCalledTimes(2);
    expect(tracker.getSnapshot()).toEqual({
      currentPsp: undefined,
      pagesProcessed: 0,
      itemsRead: 2,
      itemsProcessed: 1,
      itemsFailed: 1,
    });
  });
});
