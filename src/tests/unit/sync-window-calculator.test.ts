import { describe, expect, it } from 'vitest';
import { SyncWindowCalculator } from '../../modules/sync/domain/SyncWindowCalculator';

describe('SyncWindowCalculator', () => {
  it('deve calcular janela inicial quando não houver checkpoint', () => {
    const calculator = new SyncWindowCalculator({
      initialLookbackMinutes: 120,
      overlapMinutes: 15,
    });

    const now = new Date('2026-04-21T12:00:00.000Z');

    const result = calculator.calculate({
      now,
      checkpointLastSyncAt: undefined,
    });

    expect(result.to.toISOString()).toBe('2026-04-21T12:00:00.000Z');
    expect(result.from.toISOString()).toBe('2026-04-21T10:00:00.000Z');
  });

  it('deve aplicar overlap quando houver checkpoint', () => {
    const calculator = new SyncWindowCalculator({
      initialLookbackMinutes: 120,
      overlapMinutes: 15,
    });

    const now = new Date('2026-04-21T12:00:00.000Z');
    const checkpointLastSyncAt = new Date('2026-04-21T11:30:00.000Z');

    const result = calculator.calculate({
      now,
      checkpointLastSyncAt,
    });

    expect(result.to.toISOString()).toBe('2026-04-21T12:00:00.000Z');
    expect(result.from.toISOString()).toBe('2026-04-21T11:15:00.000Z');
  });
});
