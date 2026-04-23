import { createHash } from 'node:crypto';
import type { PspType } from '../../../shared/domain/enums/pspType';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { TransactionEntity } from '../../../transactions/domain/entities';
import type { AddRawPayloadInput, CreateSyncItemInput } from '../ports/SyncAuditRepository';
import type { SyncCheckpoint } from '../ports/SyncCheckpointRepository';

export type PersistableSyncTransaction = {
  transaction: TransactionEntity;
  psp: PspType;
  externalId: string;
};

export class SyncPersistenceMapper {
  public static toPersistableTransaction(
    transaction: TransactionEntity,
  ): PersistableSyncTransaction {
    return {
      transaction,
      psp: transaction.externalReference.psp,
      externalId: transaction.externalReference.externalId,
    };
  }

  public static toReceivedSyncItem(params: {
    syncRunId: number;
    psp: PspType;
    externalId: string;
    resourceType: string;
  }): CreateSyncItemInput {
    return {
      syncRunId: params.syncRunId,
      psp: params.psp,
      externalId: params.externalId,
      resourceType: params.resourceType,
      processingResult: 'received',
      receivedAt: new Date(),
    };
  }

  public static toRawPayloadRecord(params: {
    syncItemId: number;
    syncRunId: number;
    psp: PspType;
    externalId: string;
    rawPayload: unknown;
    payloadType: string;
  }): AddRawPayloadInput {
    const sanitizedPayload = PayloadSanitizer.sanitize(params.rawPayload);
    const payloadJson = JSON.stringify(sanitizedPayload);
    const payloadHash = createHash('sha256').update(payloadJson).digest('hex');

    return {
      syncItemId: params.syncItemId,
      syncRunId: params.syncRunId,
      psp: params.psp,
      externalId: params.externalId,
      payloadType: params.payloadType,
      payloadHash,
      payloadJson,
      sanitizedAt: new Date(),
    };
  }

  public static toCheckpoint(params: {
    psp: PspType;
    lastSyncAt?: Date;
    page?: number;
    offset?: number;
    cursor?: string;
    updatedAt?: Date;
  }): SyncCheckpoint {
    const checkpointValue = this.buildCheckpointValue(params);

    return {
      psp: params.psp,
      checkpointValue,
      lastSyncAt: params.lastSyncAt,
      page: params.page,
      offset: params.offset,
      cursor: params.cursor,
      updatedAt: params.updatedAt ?? new Date(),
    };
  }

  private static buildCheckpointValue(params: {
    lastSyncAt?: Date;
    page?: number;
    offset?: number;
    cursor?: string;
  }): string {
    if (params.cursor && params.cursor.trim().length > 0) {
      return params.cursor.trim();
    }

    if (typeof params.page === 'number') {
      return `page:${params.page}`;
    }

    if (typeof params.offset === 'number') {
      return `offset:${params.offset}`;
    }

    if (params.lastSyncAt) {
      return params.lastSyncAt.toISOString();
    }

    return 'initial';
  }
}
