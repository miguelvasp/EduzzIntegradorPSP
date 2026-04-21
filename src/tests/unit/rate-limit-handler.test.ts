import { describe, expect, it, vi } from 'vitest';
import { RateLimitHandler } from '../../modules/psp/infrastructure/resilience/RateLimitHandler';

describe('RateLimitHandler', () => {
  it('deve identificar status 429 como rate limit', () => {
    const handler = new RateLimitHandler();

    expect(handler.isRateLimited(429)).toBe(true);
    expect(handler.isRateLimited(500)).toBe(false);
    expect(handler.isRateLimited(undefined)).toBe(false);
  });

  it('deve interpretar retry-after em segundos', () => {
    const handler = new RateLimitHandler();

    expect(
      handler.getRetryAfterMs({
        'retry-after': '5',
      }),
    ).toBe(5_000);
  });

  it('deve interpretar retry-after vindo em array', () => {
    const handler = new RateLimitHandler();

    expect(
      handler.getRetryAfterMs({
        'retry-after': ['3'],
      }),
    ).toBe(3_000);
  });

  it('deve interpretar retry-after em data http', () => {
    vi.setSystemTime(new Date('2026-04-20T18:00:00.000Z'));

    const handler = new RateLimitHandler();

    expect(
      handler.getRetryAfterMs({
        'retry-after': 'Mon, 20 Apr 2026 18:00:10 GMT',
      }),
    ).toBe(10_000);
  });

  it('deve retornar undefined para retry-after invalido', () => {
    const handler = new RateLimitHandler();

    expect(
      handler.getRetryAfterMs({
        'retry-after': 'abc',
      }),
    ).toBeUndefined();
  });

  it('deve analisar rate limit com retry-after', () => {
    const handler = new RateLimitHandler();

    expect(
      handler.analyze({
        statusCode: 429,
        headers: {
          'retry-after': '7',
        },
      }),
    ).toEqual({
      isRateLimited: true,
      retryAfterMs: 7_000,
    });
  });

  it('deve analisar resposta sem rate limit', () => {
    const handler = new RateLimitHandler();

    expect(
      handler.analyze({
        statusCode: 503,
        headers: {
          'retry-after': '7',
        },
      }),
    ).toEqual({
      isRateLimited: false,
    });
  });
});
