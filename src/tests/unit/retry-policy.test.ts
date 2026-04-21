import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryPolicy } from '../../modules/psp/infrastructure/resilience/RetryPolicy';

describe('RetryPolicy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('deve identificar status retentavel', () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    expect(policy.isRetryable({ statusCode: 500 })).toBe(true);
    expect(policy.isRetryable({ status: 503 })).toBe(true);
    expect(policy.isRetryable({ response: { status: 429 } })).toBe(true);
  });

  it('nao deve identificar status nao retentavel', () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    expect(policy.isRetryable({ statusCode: 400 })).toBe(false);
    expect(policy.isRetryable({ statusCode: 401 })).toBe(false);
    expect(policy.isRetryable({ statusCode: 404 })).toBe(false);
  });

  it('deve identificar erro de timeout/rede como retentavel', () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    expect(policy.isRetryable({ code: 'ETIMEDOUT' })).toBe(true);
    expect(policy.isRetryable({ code: 'ECONNRESET' })).toBe(true);
    expect(policy.isRetryable({ name: 'TimeoutError' })).toBe(true);
  });

  it('deve calcular backoff exponencial com jitter', () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    const delayAttempt1 = policy.calculateDelay({
      attempt: 1,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    const delayAttempt2 = policy.calculateDelay({
      attempt: 2,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0.2,
    });

    expect(delayAttempt1).toBe(110);
    expect(delayAttempt2).toBe(220);
  });

  it('deve executar retry ate obter sucesso', async () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0,
    });

    const operation = vi
      .fn<(_: number) => Promise<string>>()
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce('ok');

    const onRetry = vi.fn();

    const execution = policy.execute(
      operation,
      {
        psp: 'pagarme',
        operation: 'list-orders',
        endpoint: '/core/v5/orders',
      },
      {
        onRetry,
      },
    );

    await vi.advanceTimersByTimeAsync(100);

    await expect(execution).resolves.toBe('ok');

    expect(operation).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith({
      attempt: 1,
      maxAttempts: 3,
      delayMs: 100,
      error: { statusCode: 503 },
      context: {
        psp: 'pagarme',
        operation: 'list-orders',
        endpoint: '/core/v5/orders',
      },
    });
  });

  it('nao deve fazer retry para erro nao retentavel', async () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0,
    });

    const operation = vi
      .fn<(_: number) => Promise<string>>()
      .mockRejectedValueOnce({ statusCode: 401 });

    const onGiveUp = vi.fn();

    await expect(
      policy.execute(
        operation,
        {
          psp: 'mercadopago',
          operation: 'get-payment',
          endpoint: '/v1/payments/123',
        },
        {
          onGiveUp,
        },
      ),
    ).rejects.toEqual({ statusCode: 401 });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(onGiveUp).toHaveBeenCalledWith({
      attempt: 1,
      maxAttempts: 3,
      error: { statusCode: 401 },
      context: {
        psp: 'mercadopago',
        operation: 'get-payment',
        endpoint: '/v1/payments/123',
      },
    });
  });

  it('deve encerrar na ultima tentativa e propagar erro', async () => {
    const policy = new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      backoffFactor: 2,
      jitterFactor: 0,
    });

    const operation = vi
      .fn<(_: number) => Promise<string>>()
      .mockRejectedValue({ statusCode: 503 });

    const onRetry = vi.fn();
    const onGiveUp = vi.fn();

    const execution = policy.execute(
      operation,
      {
        psp: 'pagarme',
        operation: 'list-orders',
      },
      {
        onRetry,
        onGiveUp,
      },
    );

    const rejection = expect(execution).rejects.toEqual({ statusCode: 503 });

    await vi.advanceTimersByTimeAsync(300);
    await rejection;

    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(onGiveUp).toHaveBeenCalledWith({
      attempt: 3,
      maxAttempts: 3,
      error: { statusCode: 503 },
      context: {
        psp: 'pagarme',
        operation: 'list-orders',
      },
    });
  });
});
