import { randomUUID } from 'node:crypto';
import { PspType } from '../../../shared/domain/enums/pspType';
import type {
  ReconciliationActionRecord,
  ReconciliationCaseRecord,
  ReconciliationCaseStatus,
  ReconciliationCaseType,
  ReconciliationInitialAction,
  ReconciliationSeverity,
} from '../dto/ReconciliationDecision';
import { ReconciliationActionRecorder } from './ReconciliationActionRecorder';

export class ReconciliationCaseService {
  public constructor(private readonly reconciliationActionRecorder: ReconciliationActionRecorder) {}

  public openCase(params: {
    caseType: ReconciliationCaseType;
    severity: ReconciliationSeverity;
    status: ReconciliationCaseStatus;
    transactionId?: number;
    externalId: string;
    psp: PspType;
    syncRunId?: string;
    reason: string;
    initialAction: ReconciliationInitialAction;
  }): {
    reconciliationCase: ReconciliationCaseRecord;
    initialActionRecord: ReconciliationActionRecord;
  } {
    const reconciliationCase: ReconciliationCaseRecord = {
      id: randomUUID(),
      caseType: params.caseType,
      severity: params.severity,
      status: params.status,
      transactionId: params.transactionId,
      externalId: params.externalId,
      psp: params.psp,
      syncRunId: params.syncRunId,
      reason: params.reason,
    };

    const initialActionRecord = this.reconciliationActionRecorder.record({
      caseId: reconciliationCase.id,
      action: params.initialAction,
      reason: params.reason,
      syncRunId: params.syncRunId,
    });

    return {
      reconciliationCase,
      initialActionRecord,
    };
  }
}
