import { describe, expect, it } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';

describe('SyncProgressTracker', () => {
  it('deve iniciar zerado', () => {
    const tracker = new SyncProgressTracker();

    expect(tracker.getSnapshot()).toEqual({
      currentPsp: undefined,
      pagesProcessed: 0,
      itemsRead: 0,
      itemsProcessed: 0,
      itemsFailed: 0,
    });
  });

  it('deve rastrear progresso da execução', () => {
    const tracker = new SyncProgressTracker();

    tracker.startPsp(PspType.PAGARME);
    tracker.recordPageProcessed();
    tracker.recordItemRead();
    tracker.recordItemProcessed();
    tracker.recordItemRead();
    tracker.recordItemFailed();

    expect(tracker.getSnapshot()).toEqual({
      currentPsp: PspType.PAGARME,
      pagesProcessed: 1,
      itemsRead: 2,
      itemsProcessed: 1,
      itemsFailed: 1,
    });
  });
});
