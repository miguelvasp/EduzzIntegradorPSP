import type { PspType } from '../../../shared/domain/enums/pspType';
import type { DataConflictRepository } from '../ports/DataConflictRepository';
import type { ReconciliationCaseRepository } from '../ports/ReconciliationCaseRepository';
import type { SyncAuditRepository } from '../ports/SyncAuditRepository';

export type RecordSyncConflictInput = {
  syncRunId: number;
  syncItemId?: number;
  psp: PspType;
  externalId: string;
  conflictType:
    | 'amount_mismatch'
    | 'net_amount_mismatch'
    | 'fees_mismatch'
    | 'installment_count_mismatch'
    | 'invalid_status_transition'
    | 'out_of_order_event'
    | 'payer_identity_mismatch'
    | 'audit_field_overwrite_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  incomingValue?: unknown;
  currentValue?: unknown;
  detectedAt: Date;
  openReconciliationCase: boolean;
};

export class SyncConflictRecorder {
  public constructor(
    private readonly dataConflictRepository: DataConflictRepository,
    private readonly reconciliationCaseRepository: ReconciliationCaseRepository,
    private readonly syncAuditRepository?: SyncAuditRepository,
  ) {}

  public async record(input: RecordSyncConflictInput): Promise<void> {
    if (!input.syncItemId) {
      return;
    }

    const dataConflictId = await this.dataConflictRepository.create({
      syncItemId: input.syncItemId,
      psp: input.psp,
      externalId: input.externalId,
      conflictType: input.conflictType,
      conflictStatus: 'open',
      severity: input.severity,
      existingValue:
        input.currentValue === undefined ? undefined : JSON.stringify(input.currentValue),
      incomingValue:
        input.incomingValue === undefined ? undefined : JSON.stringify(input.incomingValue),
      detectedAt: input.detectedAt,
    });

    if (input.openReconciliationCase) {
      await this.reconciliationCaseRepository.create({
        dataConflictId,
        syncItemId: input.syncItemId,
        psp: input.psp,
        externalId: input.externalId,
        caseType: this.mapConflictToCaseType(input.conflictType),
        caseStatus: 'open',
        severity: input.severity,
        openedAt: new Date(),
      });
    }

    if (this.syncAuditRepository) {
      await this.syncAuditRepository.updateSyncItem({
        syncItemId: input.syncItemId,
        processingResult: 'conflicted',
        processedAt: new Date(),
      });

      await this.syncAuditRepository.addProcessingError({
        syncRunId: input.syncRunId,
        syncItemId: input.syncItemId,
        processingStage: 'conflict_detection',
        errorCode: input.conflictType,
        errorMessage: `Conflict detected for externalId=${input.externalId}`,
        retryable: false,
        occurredAt: new Date(),
      });
    }
  }

  private mapConflictToCaseType(
    conflictType: RecordSyncConflictInput['conflictType'],
  ):
    | 'financial_divergence'
    | 'status_inconsistency'
    | 'data_incompleteness'
    | 'identity_inconsistency'
    | 'unresolved_conflict' {
    switch (conflictType) {
      case 'amount_mismatch':
      case 'net_amount_mismatch':
      case 'fees_mismatch':
        return 'financial_divergence';
      case 'invalid_status_transition':
      case 'out_of_order_event':
        return 'status_inconsistency';
      case 'payer_identity_mismatch':
        return 'identity_inconsistency';
      case 'installment_count_mismatch':
        return 'data_incompleteness';
      default:
        return 'unresolved_conflict';
    }
  }
}
