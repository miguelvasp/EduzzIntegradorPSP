import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
} from '../../modules/psp/infrastructure/resilience/CircuitBreaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('deve iniciar fechado', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 1_000,
    });

    expect(breaker.getState()).toBe('closed');
    expect(breaker.canExecute()).toBe(true);
  });

  it('deve abrir ao atingir limiar de falhas', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeoutMs: 1_000,
    });

    breaker.recordFailure();
    expect(breaker.getState()).toBe('closed');

    breaker.recordFailure();
    expect(breaker.getState()).toBe('open');
    expect(breaker.canExecute()).toBe(false);
  });

  it('deve impedir execucao quando aberto', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeoutMs: 1_000,
    });

    breaker.recordFailure();

    await expect(breaker.execute(async () => 'ok')).rejects.toBeInstanceOf(CircuitBreakerOpenError);
  });

  it('deve ir para half_open apos timeout de recuperacao', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeoutMs: 1_000,
    });

    breaker.recordFailure();
    expect(breaker.getState()).toBe('open');

    vi.advanceTimersByTime(1_000);

    expect(breaker.getState()).toBe('half_open');
    expect(breaker.canExecute()).toBe(true);
  });

  it('deve fechar novamente ao ter sucesso em half_open', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeoutMs: 1_000,
    });

    breaker.recordFailure();
    vi.advanceTimersByTime(1_000);

    await expect(breaker.execute(async () => 'recovered')).resolves.toBe('recovered');

    expect(breaker.getState()).toBe('closed');
    expect(breaker.getSnapshot()).toEqual({
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      openedAt: undefined,
    });
  });

  it('deve reabrir se falhar em half_open', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeoutMs: 1_000,
    });

    breaker.recordFailure();
    vi.advanceTimersByTime(1_000);

    await expect(
      breaker.execute(async () => {
        throw new Error('still failing');
      }),
    ).rejects.toThrow('still failing');

    expect(breaker.getState()).toBe('open');
  });

  it('deve respeitar halfOpenMaxAttempts', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeoutMs: 1_000,
      halfOpenMaxAttempts: 1,
    });

    breaker.recordFailure();
    vi.advanceTimersByTime(1_000);

    expect(breaker.getState()).toBe('half_open');
    expect(breaker.canExecute()).toBe(true);
    expect(breaker.canExecute()).toBe(false);
  });
});
