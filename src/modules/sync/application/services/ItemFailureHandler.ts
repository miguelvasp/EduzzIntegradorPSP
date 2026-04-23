import type { PspType } from '../../../shared/domain/enums/pspType';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { ItemProcessingResult } from '../dto/ItemProcessingResult';
import { SyncConflictRecorder } from './SyncConflictRecorder';
import { SyncPersistenceService } from './SyncPersistenceService';
import { SyncRejectionRecorder } from './SyncRejectionRecorder';

export type HandleItemFailureInput<TItem = unknown> = {
  error: unknown;
  syncRunId?: string;
  syncRunDbId?: number;
  correlationId?: string;
  syncItemId?: number;
  item?: TItem;
  psp: PspType;
  externalId?: string;
  resourceType?: string;
  rawPayload?: unknown;
};

export class ItemFailureHandler {
  public constructor(
    private readonly syncPersistenceService?: SyncPersistenceService,
    private readonly syncRejectionRecorder?: SyncRejectionRecorder,
    private readonly syncConflictRecorder?: SyncConflictRecorder,
  ) {}

  public async handle<TItem>(input: HandleItemFailureInput<TItem>): Promise<ItemProcessingResult> {
    const syncRunId = input.syncRunDbId;
    const externalId = input.externalId ?? 'unknown';
    const itemSyncRunId = input.syncRunId ?? (syncRunId ? String(syncRunId) : undefined);
    const errorMessage =
      input.error instanceof Error ? input.error.message : 'Unknown sync item failure';

    if (input.syncItemId && this.syncPersistenceService) {
      await this.syncPersistenceService.failIncomingItem({
        syncItemId: input.syncItemId,
      });
    }

    if (this.isExternalIntegrationError(input.error, errorMessage)) {
      if (syncRunId && this.syncPersistenceService) {
        await this.syncPersistenceService.registerIntegrationError({
          syncRunId,
          syncItemId: input.syncItemId,
          psp: input.psp,
          errorType: this.resolveIntegrationErrorType(errorMessage),
          errorCode: this.resolveTechnicalErrorCode(input.error),
          errorMessage,
          retryable: this.isRetryableError(errorMessage),
        });
      }

      return {
        psp: input.psp,
        externalId,
        syncRunId: itemSyncRunId,
        status: 'failed',
        errorCategory: 'integration',
        errorCode: this.resolveTechnicalErrorCode(input.error),
        message: errorMessage,
        shouldContinue: true,
      };
    }

    if (this.isConflictError(errorMessage)) {
      if (syncRunId && this.syncConflictRecorder) {
        await this.syncConflictRecorder.record({
          syncRunId,
          syncItemId: input.syncItemId,
          psp: input.psp,
          externalId,
          conflictType: this.resolveConflictType(errorMessage),
          severity: 'medium',
          incomingValue: PayloadSanitizer.sanitize(input.rawPayload),
          currentValue: undefined,
          detectedAt: new Date(),
          openReconciliationCase: true,
        });
      }

      return {
        psp: input.psp,
        externalId,
        syncRunId: itemSyncRunId,
        status: 'conflicted',
        errorCategory: 'domain',
        errorCode: this.resolveConflictType(errorMessage),
        message: errorMessage,
        shouldContinue: true,
      };
    }

    if (this.isBusinessRejection(input.error, errorMessage)) {
      if (syncRunId && this.syncRejectionRecorder) {
        await this.syncRejectionRecorder.record({
          syncRunId,
          syncItemId: input.syncItemId,
          psp: input.psp,
          externalId,
          rejectionType: this.resolveRejectionType(errorMessage),
          rejectionReason: errorMessage,
          validationFailureType: this.resolveValidationFailureType(errorMessage),
          validationFailureMessage: errorMessage,
        });
      }

      return {
        psp: input.psp,
        externalId,
        syncRunId: itemSyncRunId,
        status: 'rejected',
        errorCategory: 'validation',
        errorCode: this.resolveValidationFailureType(errorMessage),
        message: errorMessage,
        shouldContinue: true,
      };
    }

    if (syncRunId && this.syncPersistenceService) {
      await this.syncPersistenceService.registerProcessingError({
        syncRunId,
        syncItemId: input.syncItemId,
        processingStage: 'item_processing',
        errorCode: this.resolveTechnicalErrorCode(input.error),
        errorMessage,
        retryable: false,
      });
    }

    return {
      psp: input.psp,
      externalId,
      syncRunId: itemSyncRunId,
      status: 'failed',
      errorCategory: 'internal',
      errorCode: this.resolveTechnicalErrorCode(input.error),
      message: errorMessage,
      shouldContinue: true,
    };
  }

  private isBusinessRejection(error: unknown, message: string): boolean {
    const normalized = message.toLowerCase();

    if (error && typeof error === 'object') {
      const candidate = error as { name?: string; code?: string };

      if (
        candidate.name === 'ValidationError' ||
        candidate.code === 'VALIDATION_ERROR' ||
        candidate.code === 'UNPROCESSABLE_ENTITY'
      ) {
        return true;
      }
    }

    return (
      normalized.includes('payer') ||
      normalized.includes('installment') ||
      normalized.includes('payment method') ||
      normalized.includes('credit card') ||
      normalized.includes('external') ||
      normalized.includes('document') ||
      normalized.includes('validation') ||
      normalized.includes('incomplete')
    );
  }

  private isConflictError(message: string): boolean {
    const normalized = message.toLowerCase();

    return (
      normalized.includes('conflict') ||
      normalized.includes('divergence') ||
      normalized.includes('mismatch') ||
      normalized.includes('inconsistent')
    );
  }

  private isExternalIntegrationError(error: unknown, message: string): boolean {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('timeout') ||
      normalized.includes('econnrefused') ||
      normalized.includes('fetch failed') ||
      normalized.includes('socket hang up') ||
      normalized.includes('429') ||
      normalized.includes('503') ||
      normalized.includes('502') ||
      normalized.includes('gateway') ||
      normalized.includes('network')
    ) {
      return true;
    }

    if (error && typeof error === 'object') {
      const candidate = error as { name?: string; code?: string };

      return (
        candidate.name === 'AbortError' ||
        candidate.code === 'ECONNREFUSED' ||
        candidate.code === 'ETIMEDOUT' ||
        candidate.code === 'ECONNRESET'
      );
    }

    return false;
  }

  private isRetryableError(message: string): boolean {
    const normalized = message.toLowerCase();

    return (
      normalized.includes('timeout') ||
      normalized.includes('429') ||
      normalized.includes('502') ||
      normalized.includes('503') ||
      normalized.includes('gateway') ||
      normalized.includes('network')
    );
  }

  private resolveTechnicalErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const candidate = error as { code?: string; name?: string };

    return candidate.code ?? candidate.name;
  }

  private resolveIntegrationErrorType(
    message: string,
  ): 'timeout' | 'authentication' | 'rate_limit' | 'transport' | 'upstream_invalid_response' {
    const normalized = message.toLowerCase();

    if (normalized.includes('timeout')) {
      return 'timeout';
    }

    if (normalized.includes('401') || normalized.includes('403') || normalized.includes('auth')) {
      return 'authentication';
    }

    if (normalized.includes('429') || normalized.includes('rate')) {
      return 'rate_limit';
    }

    if (
      normalized.includes('invalid json') ||
      normalized.includes('unexpected response') ||
      normalized.includes('invalid response')
    ) {
      return 'upstream_invalid_response';
    }

    return 'transport';
  }

  private resolveValidationFailureType(
    message: string,
  ):
    | 'missing_payer'
    | 'missing_installments'
    | 'invalid_payment_method'
    | 'missing_external_id'
    | 'invalid_document'
    | 'incomplete_transaction_data' {
    const normalized = message.toLowerCase();

    if (normalized.includes('payer')) {
      return 'missing_payer';
    }

    if (normalized.includes('installment')) {
      return 'missing_installments';
    }

    if (normalized.includes('payment method') || normalized.includes('credit card')) {
      return 'invalid_payment_method';
    }

    if (normalized.includes('external')) {
      return 'missing_external_id';
    }

    if (normalized.includes('document')) {
      return 'invalid_document';
    }

    return 'incomplete_transaction_data';
  }

  private resolveRejectionType(
    message: string,
  ):
    | 'rejected_missing_payer'
    | 'rejected_missing_installments'
    | 'rejected_out_of_scope_payment_method'
    | 'rejected_invalid_required_data' {
    const normalized = message.toLowerCase();

    if (normalized.includes('payer')) {
      return 'rejected_missing_payer';
    }

    if (normalized.includes('installment')) {
      return 'rejected_missing_installments';
    }

    if (normalized.includes('payment method') || normalized.includes('credit card')) {
      return 'rejected_out_of_scope_payment_method';
    }

    return 'rejected_invalid_required_data';
  }

  private resolveConflictType(
    message: string,
  ):
    | 'amount_mismatch'
    | 'net_amount_mismatch'
    | 'fees_mismatch'
    | 'installment_count_mismatch'
    | 'invalid_status_transition'
    | 'out_of_order_event'
    | 'payer_identity_mismatch'
    | 'audit_field_overwrite_attempt' {
    const normalized = message.toLowerCase();

    if (normalized.includes('amount')) {
      return 'amount_mismatch';
    }

    if (normalized.includes('net')) {
      return 'net_amount_mismatch';
    }

    if (normalized.includes('fee')) {
      return 'fees_mismatch';
    }

    if (normalized.includes('status')) {
      return 'invalid_status_transition';
    }

    if (normalized.includes('payer')) {
      return 'payer_identity_mismatch';
    }

    if (normalized.includes('installment')) {
      return 'installment_count_mismatch';
    }

    return 'audit_field_overwrite_attempt';
  }
}
