import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResiliencePolicy } from '../../modules/psp/infrastructure/resilience/ResiliencePolicy';
import { IntegrationError } from '../../modules/shared/application/errors';

describe('ResiliencePolicy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global.Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('deve executar operacao com sucesso sem acionar retry', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 500,
      retry: {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 2,
        recoveryTimeoutMs: 1_000,
      },
    });

    const operation = vi.fn().mockResolvedValue('ok');

    await expect(
      policy.execute(operation, {
        psp: 'pagarme',
        operation: 'list-orders',
      }),
    ).resolves.toBe('ok');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(policy.getCircuitBreaker().getState()).toBe('closed');
  });

  it('deve aplicar retry para falha transitoria e recuperar', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 500,
      retry: {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeoutMs: 1_000,
      },
    });

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce('ok');

    const onRetry = vi.fn();

    const execution = policy.execute(operation, {
      psp: 'mercadopago',
      operation: 'search-payments',
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(100);

    await expect(execution).resolves.toBe('ok');

    expect(operation).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('deve falhar com IntegrationError ao estourar timeout', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 100,
      retry: {
        maxAttempts: 1,
        baseDelayMs: 50,
        maxDelayMs: 100,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 2,
        recoveryTimeoutMs: 1_000,
      },
    });

    const operation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('late'), 1_000);
        }),
    );

    const execution = policy.execute(operation, {
      psp: 'pagarme',
      operation: 'get-order',
      endpoint: '/core/v5/orders/1',
    });

    const rejection = expect(execution).rejects.toBeInstanceOf(IntegrationError);

    await vi.advanceTimersByTimeAsync(100);
    await rejection;
  });

  it('deve disparar onRateLimited quando erro final for 429', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 500,
      retry: {
        maxAttempts: 2,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeoutMs: 1_000,
      },
    });

    const onRateLimited = vi.fn();
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue({
      response: {
        status: 429,
        headers: {
          'retry-after': '4',
        },
      },
    });

    const execution = policy.execute(operation, {
      psp: 'mercadopago',
      operation: 'search-payments',
      onRateLimited,
    });

    const rejection = expect(execution).rejects.toBeInstanceOf(IntegrationError);

    await vi.advanceTimersByTimeAsync(100);
    await rejection;

    expect(onRateLimited).toHaveBeenCalledTimes(1);
    expect(onRateLimited).toHaveBeenCalledWith({
      retryAfterMs: 4_000,
      context: {
        psp: 'mercadopago',
        operation: 'search-payments',
        onRateLimited,
      },
    });
  });

  it('deve abrir o circuit breaker apos falhas consecutivas', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 500,
      retry: {
        maxAttempts: 1,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 2,
        recoveryTimeoutMs: 1_000,
      },
    });

    const failingOperation = vi.fn<() => Promise<string>>().mockRejectedValue({ statusCode: 503 });

    await expect(
      policy.execute(failingOperation, {
        psp: 'pagarme',
        operation: 'list-orders',
      }),
    ).rejects.toBeInstanceOf(IntegrationError);

    await expect(
      policy.execute(failingOperation, {
        psp: 'pagarme',
        operation: 'list-orders',
      }),
    ).rejects.toBeInstanceOf(IntegrationError);

    expect(policy.getCircuitBreaker().getState()).toBe('open');

    await expect(
      policy.execute(async () => 'should not run', {
        psp: 'pagarme',
        operation: 'list-orders',
      }),
    ).rejects.toBeInstanceOf(IntegrationError);
  });

  it('deve permitir recuperacao apos janela do circuit breaker', async () => {
    const policy = new ResiliencePolicy({
      timeoutMs: 500,
      retry: {
        maxAttempts: 1,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        backoffFactor: 2,
        jitterFactor: 0,
      },
      circuitBreaker: {
        failureThreshold: 1,
        recoveryTimeoutMs: 1_000,
      },
    });

    await expect(
      policy.execute(
        async () => {
          throw { statusCode: 503 };
        },
        {
          psp: 'mercadopago',
          operation: 'get-payment',
        },
      ),
    ).rejects.toBeInstanceOf(IntegrationError);

    expect(policy.getCircuitBreaker().getState()).toBe('open');

    vi.advanceTimersByTime(1_000);

    await expect(
      policy.execute(async () => 'recovered', {
        psp: 'mercadopago',
        operation: 'get-payment',
      }),
    ).resolves.toBe('recovered');

    expect(policy.getCircuitBreaker().getState()).toBe('closed');
  });
});
