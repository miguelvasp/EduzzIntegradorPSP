import type { RequestContextState } from './RequestContext';

export class LogContextFactory {
  public static forHttp(input?: Partial<RequestContextState>): RequestContextState {
    return {
      ...input,
      module: input?.module ?? 'http',
      component: input?.component ?? 'request',
    };
  }

  public static forSync(input?: Partial<RequestContextState>): RequestContextState {
    return {
      ...input,
      module: input?.module ?? 'sync',
      component: input?.component ?? 'execution',
    };
  }

  public static forPsp(input?: Partial<RequestContextState>): RequestContextState {
    return {
      ...input,
      module: input?.module ?? 'psp',
      component: input?.component ?? 'client',
    };
  }

  public static forTransactions(input?: Partial<RequestContextState>): RequestContextState {
    return {
      ...input,
      module: input?.module ?? 'transactions',
      component: input?.component ?? 'processing',
    };
  }

  public static forReconciliation(input?: Partial<RequestContextState>): RequestContextState {
    return {
      ...input,
      module: input?.module ?? 'reconciliation',
      component: input?.component ?? 'case',
    };
  }
}
