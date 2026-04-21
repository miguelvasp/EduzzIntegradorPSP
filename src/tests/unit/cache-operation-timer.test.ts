import { describe, expect, it } from 'vitest';
import { CacheOperationTimer } from '../../modules/shared/infrastructure/cache/CacheOperationTimer';

describe('CacheOperationTimer', () => {
  it('deve retornar duração maior ou igual a zero', () => {
    const timer = new CacheOperationTimer();

    const duration = timer.elapsedMs();

    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('deve funcionar em uso simples', async () => {
    const timer = new CacheOperationTimer();

    await Promise.resolve();

    const duration = timer.elapsedMs();

    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
