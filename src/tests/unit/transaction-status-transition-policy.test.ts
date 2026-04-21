import { describe, expect, it } from 'vitest';
import { TransactionStatusTransitionPolicy } from '../../modules/transactions/domain/policies/TransactionStatusTransitionPolicy';

describe('TransactionStatusTransitionPolicy', () => {
  it('deve aceitar pending -> paid', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'pending',
      nextStatus: 'paid',
    });

    expect(result.decision).toBe('valid');
  });

  it('deve aceitar pending -> canceled', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'pending',
      nextStatus: 'canceled',
    });

    expect(result.decision).toBe('valid');
  });

  it('deve aceitar paid -> refunded', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'paid',
      nextStatus: 'refunded',
    });

    expect(result.decision).toBe('valid');
  });

  it('deve retornar equivalente para paid -> paid', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'paid',
      nextStatus: 'paid',
    });

    expect(result.decision).toBe('equivalent');
  });

  it('deve retornar suspeita para unknown -> paid', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'unknown',
      nextStatus: 'paid',
    });

    expect(result.decision).toBe('suspicious');
  });

  it('deve invalidar paid -> pending', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'paid',
      nextStatus: 'pending',
    });

    expect(result.decision).toBe('invalid');
  });

  it('deve invalidar refunded -> paid', () => {
    const policy = new TransactionStatusTransitionPolicy();

    const result = policy.evaluate({
      currentStatus: 'refunded',
      nextStatus: 'paid',
    });

    expect(result.decision).toBe('invalid');
  });
});
