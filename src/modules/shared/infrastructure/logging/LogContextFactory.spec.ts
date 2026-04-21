import { describe, expect, it } from 'vitest';
import { LogContextFactory } from './LogContextFactory';

describe('LogContextFactory', () => {
  it('should create http context', () => {
    const context = LogContextFactory.forHttp({
      requestId: 'req-1',
    });

    expect(context).toMatchObject({
      requestId: 'req-1',
      module: 'http',
      component: 'request',
    });
  });

  it('should create sync context', () => {
    const context = LogContextFactory.forSync({
      syncRunId: 10,
      psp: 'mercadopago',
    });

    expect(context).toMatchObject({
      syncRunId: 10,
      psp: 'mercadopago',
      module: 'sync',
      component: 'execution',
    });
  });

  it('should create psp context', () => {
    const context = LogContextFactory.forPsp({
      psp: 'pagarme',
      externalId: 'or_123',
    });

    expect(context).toMatchObject({
      psp: 'pagarme',
      externalId: 'or_123',
      module: 'psp',
      component: 'client',
    });
  });

  it('should create transactions context', () => {
    const context = LogContextFactory.forTransactions({
      transactionId: 1,
    });

    expect(context).toMatchObject({
      transactionId: 1,
      module: 'transactions',
      component: 'processing',
    });
  });

  it('should create reconciliation context', () => {
    const context = LogContextFactory.forReconciliation({
      reconciliationCaseId: 7,
    });

    expect(context).toMatchObject({
      reconciliationCaseId: 7,
      module: 'reconciliation',
      component: 'case',
    });
  });
});
