import { describe, expect, it } from 'vitest';
import { RequestContext } from './RequestContext';

describe('RequestContext', () => {
  it('should create a base context with requestId and correlationId', () => {
    const context = RequestContext.createBaseContext();

    expect(context.requestId).toBeDefined();
    expect(context.correlationId).toBeDefined();
  });

  it('should use requestId as correlationId when correlationId is absent', () => {
    const context = RequestContext.createBaseContext({
      requestId: 'req-1',
    });

    expect(context.requestId).toBe('req-1');
    expect(context.correlationId).toBe('req-1');
  });

  it('should preserve provided correlationId', () => {
    const context = RequestContext.createBaseContext({
      requestId: 'req-1',
      correlationId: 'corr-1',
    });

    expect(context.requestId).toBe('req-1');
    expect(context.correlationId).toBe('corr-1');
  });

  it('should store and retrieve context inside run', () => {
    const result = RequestContext.run(
      RequestContext.createBaseContext({
        requestId: 'req-1',
        correlationId: 'corr-1',
        module: 'http',
      }),
      () => RequestContext.get(),
    );

    expect(result).toMatchObject({
      requestId: 'req-1',
      correlationId: 'corr-1',
      module: 'http',
    });
  });

  it('should update existing context with set', () => {
    const result = RequestContext.run(RequestContext.createBaseContext(), () => {
      RequestContext.set({
        syncRunId: 123,
        psp: 'pagarme',
      });

      return RequestContext.get();
    });

    expect(result).toMatchObject({
      syncRunId: 123,
      psp: 'pagarme',
    });
  });
});
