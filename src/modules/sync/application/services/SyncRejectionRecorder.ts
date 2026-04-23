import type { PspType } from '../../../shared/domain/enums/pspType';
import type { RejectedRecordRepository } from '../ports/RejectedRecordRepository';
import type { SyncAuditRepository } from '../ports/SyncAuditRepository';
import type { ValidationFailureRepository } from '../ports/ValidationFailureRepository';

export type RecordSyncRejectionInput = {
  syncRunId: number;
  syncItemId?: number;
  psp: PspType;
  externalId: string;
  rejectionType:
    | 'rejected_missing_payer'
    | 'rejected_missing_installments'
    | 'rejected_out_of_scope_payment_method'
    | 'rejected_invalid_required_data';
  rejectionReason: string;
  validationFailureType:
    | 'missing_payer'
    | 'missing_installments'
    | 'invalid_payment_method'
    | 'missing_external_id'
    | 'invalid_document'
    | 'incomplete_transaction_data';
  validationFailureMessage: string;
};

export class SyncRejectionRecorder {
  public constructor(
    private readonly validationFailureRepository: ValidationFailureRepository,
    private readonly rejectedRecordRepository: RejectedRecordRepository,
    private readonly syncAuditRepository?: SyncAuditRepository,
  ) {}

  public async record(input: RecordSyncRejectionInput): Promise<void> {
    if (!input.syncItemId) {
      return;
    }

    const validationFailureId = await this.validationFailureRepository.create({
      syncItemId: input.syncItemId,
      psp: input.psp,
      externalId: input.externalId,
      failureType: input.validationFailureType,
      failureCode: input.validationFailureType,
      failureMessage: input.validationFailureMessage,
      occurredAt: new Date(),
    });

    await this.rejectedRecordRepository.create({
      syncItemId: input.syncItemId,
      validationFailureId,
      syncRunId: input.syncRunId,
      psp: input.psp,
      externalId: input.externalId,
      rejectionType: input.rejectionType,
      rejectionReason: input.rejectionReason,
      rejectedAt: new Date(),
    });

    if (this.syncAuditRepository) {
      await this.syncAuditRepository.updateSyncItem({
        syncItemId: input.syncItemId,
        processingResult: 'rejected',
        processedAt: new Date(),
      });

      await this.syncAuditRepository.addProcessingError({
        syncRunId: input.syncRunId,
        syncItemId: input.syncItemId,
        processingStage: 'validation',
        errorCode: input.validationFailureType,
        errorMessage: input.validationFailureMessage,
        retryable: false,
        occurredAt: new Date(),
      });
    }
  }
}
