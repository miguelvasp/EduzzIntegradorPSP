import {
  DomainError,
  IntegrationError,
  InternalError,
  ValidationError,
} from '../../../shared/application/errors';
import type { PspType } from '../../../shared/domain/enums/pspType';
import type { ItemProcessingResult } from '../dto/ItemProcessingResult';

export class ItemFailureHandler {
  public handle(params: {
    error: unknown;
    psp: PspType;
    externalId?: string;
    syncRunId?: string;
  }): ItemProcessingResult {
    if (params.error instanceof ValidationError) {
      return {
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
        status: 'rejected',
        errorCategory: 'validation',
        errorCode: params.error.code,
        message: params.error.message,
        shouldContinue: true,
      };
    }

    if (params.error instanceof DomainError) {
      return {
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
        status: 'conflicted',
        errorCategory: 'domain',
        errorCode: params.error.code,
        message: params.error.message,
        shouldContinue: true,
      };
    }

    if (params.error instanceof IntegrationError) {
      return {
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
        status: 'failed',
        errorCategory: 'integration',
        errorCode: params.error.code,
        message: params.error.message,
        shouldContinue: true,
      };
    }

    if (params.error instanceof InternalError) {
      return {
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
        status: 'failed',
        errorCategory: 'internal',
        errorCode: params.error.code,
        message: params.error.message,
        shouldContinue: true,
      };
    }

    return {
      psp: params.psp,
      externalId: params.externalId,
      syncRunId: params.syncRunId,
      status: 'failed',
      errorCategory: 'internal',
      errorCode: 'unexpected.item_processing_failure',
      message:
        params.error instanceof Error ? params.error.message : 'Unexpected item processing failure',
      shouldContinue: true,
    };
  }
}
