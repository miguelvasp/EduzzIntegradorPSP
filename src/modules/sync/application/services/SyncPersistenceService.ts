import { createHash, randomUUID } from 'node:crypto';
import type { OutboxRepository } from '../../../outbox/application/ports/OutboxRepository';
import type { UnitOfWork } from '../../../outbox/application/ports/UnitOfWork';
import type { PspType } from '../../../shared/domain/enums/pspType';
import { PayloadSanitizer } from '../../../shared/infrastructure/security/PayloadSanitizer';
import type { InstallmentPersistenceRepository } from '../../../transactions/application/ports/InstallmentPersistenceRepository';
import type { PayerPersistenceRepository } from '../../../transactions/application/ports/PayerPersistenceRepository';
import type { TransactionAuditRepository } from '../../../transactions/application/ports/TransactionAuditRepository';
import type { TransactionPersistenceRepository } from '../../../transactions/application/ports/TransactionPersistenceRepository';
import type { TransactionEntity } from '../../../transactions/domain/entities';
import type {
  IdempotencyRepository,
  RegisterIdempotencyDecisionInput,
} from '../ports/IdempotencyRepository';
import type { SyncAuditRepository, SyncItemProcessingResult } from '../ports/SyncAuditRepository';
import type { SyncCheckpointRepository } from '../ports/SyncCheckpointRepository';
import { SyncPersistenceMapper } from './SyncPersistenceMapper';

export type RegisterIncomingItemInput = {
  syncRunDbId?: number;
  psp: PspType;
  externalId: string;
  resourceType: string;
  rawPayload: unknown;
};

export type CompleteIncomingItemInput = {
  syncItemId: number;
  processingResult: Extract<SyncItemProcessingResult, 'inserted' | 'updated' | 'processed'>;
  transactionId?: number;
};

export type FailIncomingItemInput = {
  syncItemId: number;
};

export type RegisterIntegrationErrorInput = {
  syncRunId: number;
  syncRunSourceId?: number;
  syncRunPageId?: number;
  syncItemId?: number;
  psp: PspType;
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  retryable: boolean;
};

export type RegisterProcessingErrorInput = {
  syncRunId: number;
  syncItemId?: number;
  transactionId?: number;
  processingStage: string;
  errorCode?: string;
  errorMessage: string;
  retryable: boolean;
};

export type PersistSyncTransactionInput = {
  transaction: TransactionEntity;
  lastSyncAt?: Date;
  checkpoint?: {
    psp: PspType;
    page?: number;
    offset?: number;
    cursor?: string;
    lastSyncAt?: Date;
  };
  syncRunId?: number | string;
  correlationId?: string;
};

export type PersistSyncTransactionResult = {
  transactionId: number;
  decision: RegisterIdempotencyDecisionInput['decision'];
};

export class SyncPersistenceService {
  public constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly transactionPersistenceRepository: TransactionPersistenceRepository,
    private readonly installmentPersistenceRepository: InstallmentPersistenceRepository,
    private readonly payerPersistenceRepository: PayerPersistenceRepository,
    private readonly syncCheckpointRepository: SyncCheckpointRepository,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly syncAuditRepository?: SyncAuditRepository,
    private readonly transactionAuditRepository?: TransactionAuditRepository,
  ) {}

  public async registerIncomingItem(input: RegisterIncomingItemInput): Promise<number | undefined> {
    if (!this.syncAuditRepository || !input.syncRunDbId) {
      return undefined;
    }

    const syncItemId = await this.syncAuditRepository.createSyncItem(
      SyncPersistenceMapper.toReceivedSyncItem({
        syncRunId: input.syncRunDbId,
        psp: input.psp,
        externalId: input.externalId,
        resourceType: input.resourceType,
      }),
    );

    await this.syncAuditRepository.addRawPayload(
      SyncPersistenceMapper.toRawPayloadRecord({
        syncItemId,
        syncRunId: input.syncRunDbId,
        psp: input.psp,
        externalId: input.externalId,
        rawPayload: input.rawPayload,
        payloadType: input.resourceType,
      }),
    );

    return syncItemId;
  }

  public async completeIncomingItem(input: CompleteIncomingItemInput): Promise<void> {
    if (!this.syncAuditRepository) {
      return;
    }

    await this.syncAuditRepository.updateSyncItem({
      syncItemId: input.syncItemId,
      processingResult: input.processingResult,
      transactionId: input.transactionId,
      processedAt: new Date(),
    });
  }

  public async failIncomingItem(input: FailIncomingItemInput): Promise<void> {
    if (!this.syncAuditRepository) {
      return;
    }

    await this.syncAuditRepository.updateSyncItem({
      syncItemId: input.syncItemId,
      processingResult: 'failed',
      processedAt: new Date(),
    });
  }

  public async registerIntegrationError(input: RegisterIntegrationErrorInput): Promise<void> {
    if (!this.syncAuditRepository) {
      return;
    }

    await this.syncAuditRepository.addIntegrationError({
      ...input,
      occurredAt: new Date(),
    });
  }

  public async registerProcessingError(input: RegisterProcessingErrorInput): Promise<void> {
    if (!this.syncAuditRepository) {
      return;
    }

    await this.syncAuditRepository.addProcessingError({
      ...input,
      occurredAt: new Date(),
    });
  }

  public async persistTransaction(
    input: PersistSyncTransactionInput,
  ): Promise<PersistSyncTransactionResult> {
    const persistable = SyncPersistenceMapper.toPersistableTransaction(input.transaction);

    return this.unitOfWork.execute(async () => {
      const existing = await this.idempotencyRepository.findTransactionByKey({
        psp: persistable.psp,
        externalId: persistable.externalId,
      });

      const existingTransaction = existing?.transaction;
      const previousTransactionStatus = existingTransaction?.status;
      const previousInstallments = new Map(
        (existingTransaction?.installments ?? []).map((installment) => [
          installment.installmentNumber,
          installment,
        ]),
      );

      const payerId = await this.payerPersistenceRepository.upsertFromSnapshot({
        psp: persistable.psp,
        payer: persistable.transaction.payerSnapshot,
      });

      const lastSyncedAt = input.lastSyncAt ?? new Date();
      let transactionId: number;
      let decision: RegisterIdempotencyDecisionInput['decision'];

      if (existingTransaction?.id) {
        transactionId = existingTransaction.id;
        decision = 'updated';

        await this.transactionPersistenceRepository.update({
          transactionId,
          transaction: persistable.transaction,
          payerId,
          lastSyncedAt,
        });
      } else {
        transactionId = await this.transactionPersistenceRepository.insert({
          transaction: persistable.transaction,
          payerId,
          lastSyncedAt,
        });
        decision = 'inserted';
      }

      const persistedInstallments =
        await this.installmentPersistenceRepository.replaceByTransactionId(
          transactionId,
          persistable.transaction.installments,
        );

      await this.payerPersistenceRepository.saveSnapshot({
        transactionId,
        payerId,
        psp: persistable.psp,
        payer: persistable.transaction.payerSnapshot,
      });

      await this.idempotencyRepository.registerDecision({
        key: {
          psp: persistable.psp,
          externalId: persistable.externalId,
        },
        decision,
      });

      if (input.checkpoint) {
        await this.syncCheckpointRepository.save(
          SyncPersistenceMapper.toCheckpoint({
            psp: input.checkpoint.psp,
            lastSyncAt: input.checkpoint.lastSyncAt ?? input.transaction.updatedAt,
            page: input.checkpoint.page,
            offset: input.checkpoint.offset,
            cursor: input.checkpoint.cursor,
            updatedAt: new Date(),
          }),
        );
      }

      await this.outboxRepository.add({
        id: randomUUID(),
        eventType: 'transaction.persisted',
        aggregateType: 'transaction',
        aggregateId: String(transactionId),
        payload: {
          transactionId,
          psp: persistable.psp,
          externalId: persistable.externalId,
          status: persistable.transaction.status,
          installmentCount: persistable.transaction.installmentCount,
          decision,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        availableAt: new Date().toISOString(),
        correlationId: input.correlationId,
        syncRunId: input.syncRunId ? String(input.syncRunId) : undefined,
        retryCount: 0,
      });

      const syncRunDbId = typeof input.syncRunId === 'number' ? input.syncRunId : undefined;

      if (this.transactionAuditRepository) {
        const evidencePayload = this.buildIntegrationEvidencePayload(
          persistable.transaction,
          transactionId,
          decision,
        );
        const evidencePayloadJson = JSON.stringify(evidencePayload);
        const evidencePayloadHash = createHash('sha256').update(evidencePayloadJson).digest('hex');

        await this.transactionAuditRepository.recordTransactionIntegrationEvidence({
          transactionId,
          psp: persistable.psp,
          externalId: persistable.externalId,
          resourceType: 'transaction',
          resourceId: String(transactionId),
          captureType: decision,
          capturedAt: new Date(),
          syncRunId: syncRunDbId,
          payloadJson: evidencePayloadJson,
          payloadHash: evidencePayloadHash,
        });

        const eventPayload = {
          transactionId,
          psp: persistable.psp,
          externalId: persistable.externalId,
          status: persistable.transaction.status,
          decision,
          installmentCount: persistable.transaction.installmentCount,
        };
        const eventPayloadJson = JSON.stringify(eventPayload);
        const eventPayloadHash = createHash('sha256').update(eventPayloadJson).digest('hex');

        await this.transactionAuditRepository.recordTransactionEvent({
          transactionId,
          eventType: decision === 'inserted' ? 'transaction.inserted' : 'transaction.updated',
          eventStatus: 'completed',
          occurredAt: new Date(),
          syncRunId: syncRunDbId,
          payloadJson: eventPayloadJson,
          payloadHash: eventPayloadHash,
        });

        if (
          decision === 'inserted' ||
          previousTransactionStatus !== persistable.transaction.status
        ) {
          await this.transactionAuditRepository.recordTransactionStatusHistory({
            transactionId,
            previousStatus: previousTransactionStatus,
            newStatus: persistable.transaction.status,
            statusSource: 'sync',
            changedAt: persistable.transaction.updatedAt,
            syncRunId: syncRunDbId,
            reasonCode: decision,
            notes: `Transaction ${decision} during sync persistence`,
          });
        }

        const installmentHistoryInputs = persistedInstallments.reduce<
          Parameters<TransactionAuditRepository['recordInstallmentStatusHistory']>[0]
        >((acc, installment) => {
          const previousInstallment = previousInstallments.get(installment.installmentNumber);

          if (decision !== 'inserted' && previousInstallment?.status === installment.status) {
            return acc;
          }

          acc.push({
            installmentId: installment.id,
            previousStatus: previousInstallment?.status,
            newStatus: installment.status,
            statusSource: 'sync',
            changedAt: persistable.transaction.updatedAt,
            syncRunId: syncRunDbId,
            reasonCode: decision,
            notes: `Installment ${installment.installmentNumber} ${decision} during sync persistence`,
          });

          return acc;
        }, []);

        if (installmentHistoryInputs.length > 0) {
          await this.transactionAuditRepository.recordInstallmentStatusHistory(
            installmentHistoryInputs,
          );
        }
      }

      return {
        transactionId,
        decision,
      };
    });
  }

  private buildIntegrationEvidencePayload(
    transaction: TransactionEntity,
    transactionId: number,
    decision: RegisterIdempotencyDecisionInput['decision'],
  ): Record<string, unknown> {
    return PayloadSanitizer.sanitize({
      transactionId,
      decision,
      transaction: {
        id: transaction.id,
        externalReference: {
          psp: transaction.externalReference.psp,
          externalId: transaction.externalReference.externalId,
        },
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        originalAmount: transaction.originalAmount.amountInCents,
        netAmount: transaction.netAmount.amountInCents,
        fees: transaction.fees.amountInCents,
        installmentCount: transaction.installmentCount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        payerSnapshot: {
          externalId: transaction.payerSnapshot.externalId,
          name: transaction.payerSnapshot.name,
          email: transaction.payerSnapshot.email,
          documentHash: transaction.payerSnapshot.documentHash.value,
          documentType: transaction.payerSnapshot.documentType,
        },
        installments: transaction.installments.map((installment) => ({
          id: installment.id,
          transactionId: installment.transactionId,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount.amountInCents,
          fees: installment.fees.amountInCents,
          status: installment.status,
          dueDate: installment.dueDate,
          paidAt: installment.paidAt,
        })),
      },
    }) as Record<string, unknown>;
  }
}
