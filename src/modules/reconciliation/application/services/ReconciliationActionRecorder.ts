import type {
  ReconciliationActionRecord,
  ReconciliationInitialAction,
} from '../dto/ReconciliationDecision';

export class ReconciliationActionRecorder {
  public record(params: {
    caseId: string;
    action: ReconciliationInitialAction;
    reason: string;
    syncRunId?: string;
  }): ReconciliationActionRecord {
    return {
      caseId: params.caseId,
      action: params.action,
      reason: params.reason,
      syncRunId: params.syncRunId,
    };
  }
}
