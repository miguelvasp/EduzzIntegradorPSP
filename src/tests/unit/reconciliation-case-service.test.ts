import { describe, expect, it } from 'vitest';
import { ReconciliationActionRecorder } from '../../modules/reconciliation/application/services/ReconciliationActionRecorder';
import { ReconciliationCaseService } from '../../modules/reconciliation/application/services/ReconciliationCaseService';
import { PspType } from '../../modules/shared/domain/enums/pspType';

describe('ReconciliationCaseService', () => {
  it('deve abrir caso e registrar ação inicial', () => {
    const service = new ReconciliationCaseService(new ReconciliationActionRecorder());

    const result = service.openCase({
      caseType: 'financial_divergence',
      severity: 'high',
      status: 'under_review',
      transactionId: 123,
      externalId: 'or_123',
      psp: PspType.PAGARME,
      syncRunId: 'sync-1',
      reason: 'Original amount diverged',
      initialAction: 'case_opened',
    });

    expect(result.reconciliationCase.id).toBeTruthy();
    expect(result.reconciliationCase.caseType).toBe('financial_divergence');
    expect(result.reconciliationCase.severity).toBe('high');
    expect(result.reconciliationCase.status).toBe('under_review');
    expect(result.reconciliationCase.transactionId).toBe(123);
    expect(result.reconciliationCase.externalId).toBe('or_123');
    expect(result.reconciliationCase.psp).toBe(PspType.PAGARME);
    expect(result.initialActionRecord.caseId).toBe(result.reconciliationCase.id);
    expect(result.initialActionRecord.action).toBe('case_opened');
    expect(result.initialActionRecord.reason).toBe('Original amount diverged');
  });
});
