import { appLogger } from '../../../../app/server/logging';
import type { PspType } from '../../../shared/domain/enums/pspType';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { ItemProcessingResult } from '../dto/ItemProcessingResult';
import { ItemFailureHandler } from './ItemFailureHandler';

export class ItemProcessingExecutor {
  public constructor(private readonly itemFailureHandler: ItemFailureHandler) {}

  public async execute<T>(params: {
    psp: PspType;
    externalId?: string;
    syncRunId?: string;
    action: () => Promise<T> | T;
  }): Promise<ItemProcessingResult> {
    try {
      await params.action();

      return {
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
        status: 'processed_successfully',
        shouldContinue: true,
      };
    } catch (error) {
      const result = await this.itemFailureHandler.handle({
        error,
        psp: params.psp,
        externalId: params.externalId,
        syncRunId: params.syncRunId,
      });

      appLogger.error({
        eventType: 'sync_item_processing_failed',
        message: 'Sync item processing failed',
        status: 'failed',
        errorCode: result.errorCode,
        context: PayloadSanitizer.sanitize({
          psp: result.psp,
          externalId: result.externalId,
          syncRunId: result.syncRunId,
          errorCategory: result.errorCategory,
          itemStatus: result.status,
          shouldContinue: result.shouldContinue,
          message: result.message,
        }) as Record<string, unknown>,
      });

      return result;
    }
  }
}
