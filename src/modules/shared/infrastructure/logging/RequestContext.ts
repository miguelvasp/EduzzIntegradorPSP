import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type RequestContextState = {
  requestId?: string;
  correlationId?: string;
  syncRunId?: number | string;
  module?: string;
  component?: string;
  psp?: string;
  externalId?: string;
  transactionId?: number | string;
  installmentId?: number | string;
  reconciliationCaseId?: number | string;
};

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextState>();

  public static run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  public static get(): RequestContextState {
    return this.storage.getStore() ?? {};
  }

  public static set(values: Partial<RequestContextState>): void {
    const current = this.get();

    Object.assign(current, values);
  }

  public static getRequestId(): string | undefined {
    return this.get().requestId;
  }

  public static getCorrelationId(): string | undefined {
    return this.get().correlationId;
  }

  public static ensureRequestId(): string {
    const current = this.get();

    if (!current.requestId) {
      current.requestId = randomUUID();
    }

    return current.requestId;
  }

  public static ensureCorrelationId(): string {
    const current = this.get();

    if (!current.correlationId) {
      current.correlationId = current.requestId ?? randomUUID();
    }

    return current.correlationId;
  }

  public static createBaseContext(input?: Partial<RequestContextState>): RequestContextState {
    const requestId = input?.requestId ?? randomUUID();
    const correlationId = input?.correlationId ?? requestId;

    return {
      ...input,
      requestId,
      correlationId,
    };
  }
}
