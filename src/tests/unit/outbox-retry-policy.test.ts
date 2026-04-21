import { describe, expect, it } from 'vitest';
import { OutboxRetryPolicy } from '../../modules/outbox/application/services/OutboxRetryPolicy';

describe('OutboxRetryPolicy', () => {
  it('deve considerar erro transitório como retentável', () => {
    const policy = new OutboxRetryPolicy({
      maxRetries: 3,
      baseDelaySeconds: 10,
    });

    expect(policy.isRetriable(new Error('timeout on network call'))).toBe(true);
  });

  it('deve considerar erro estrutural como não retentável', () => {
    const policy = new OutboxRetryPolicy({
      maxRetries: 3,
      baseDelaySeconds: 10,
    });

    expect(policy.isRetriable(new Error('invalid payload structure'))).toBe(false);
  });

  it('deve calcular próxima tentativa com backoff simples', () => {
    const policy = new OutboxRetryPolicy({
      maxRetries: 3,
      baseDelaySeconds: 10,
    });

    const now = new Date('2026-04-21T12:00:00.000Z');
    const nextAttemptAt = policy.getNextAttemptAt(1, now);

    expect(nextAttemptAt).toBe('2026-04-21T12:00:20.000Z');
  });

  it('deve respeitar limite de retries', () => {
    const policy = new OutboxRetryPolicy({
      maxRetries: 2,
      baseDelaySeconds: 10,
    });

    expect(policy.shouldRetry(0, new Error('timeout'))).toBe(true);
    expect(policy.shouldRetry(1, new Error('timeout'))).toBe(true);
    expect(policy.shouldRetry(2, new Error('timeout'))).toBe(false);
  });
});
