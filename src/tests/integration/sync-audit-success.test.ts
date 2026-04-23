import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { SyncPersistenceService } from '../../modules/sync/application/services/SyncPersistenceService';
import { createDocumentHashValueObject } from '../../modules/transactions/domain/value-objects/document-hash.value-object';
import { createExternalTransactionReferenceValueObject } from '../../modules/transactions/domain/value-objects/external-transaction-reference.value-object';
import { createMoneyValueObject } from '../../modules/transactions/domain/value-objects/money.value-object';

describe('sync persistence audit success integration', () => {
  function createTransaction() {
    return {
      id: 0,
      externalReference: createExternalTransactionReferenceValueObject({
        psp: 'pagarme',
        externalId: 'or_success_1',
      }),
      paymentMethod: 'credit_card' as const,
      status: 'paid' as const,
      originalAmount: createMoneyValueObject({ amountInCents: 10000 }),
      netAmount: createMoneyValueObject({ amountInCents: 9700 }),
      fees: createMoneyValueObject({ amountInCents: 300 }),
      installmentCount: 2,
      currency: 'BRL',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      updatedAt: new Date('2026-04-22T10:01:00.000Z'),
      payerSnapshot: {
        externalId: 'cus_success_1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        documentHash: createDocumentHashValueObject('hash_document_success_123456789'),
        documentType: 'cpf' as const,
      },
      installments: [
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 1,
          amount: createMoneyValueObject({ amountInCents: 5000 }),
          fees: createMoneyValueObject({ amountInCents: 150 }),
          status: 'paid' as const,
          dueDate: new Date('2026-05-10T00:00:00.000Z'),
          paidAt: new Date('2026-05-10T00:00:00.000Z'),
        },
        {
          id: 0,
          transactionId: 0,
          installmentNumber: 2,
          amount: createMoneyValueObject({ amountInCents: 5000 }),
          fees: createMoneyValueObject({ amountInCents: 150 }),
          status: 'scheduled' as const,
          dueDate: new Date('2026-06-10T00:00:00.000Z'),
        },
      ],
    };
  }

  it('deve preencher trilha operacional, entidades e auditoria no caminho feliz', async () => {
    const unitOfWork = {
      execute: vi.fn(async (callback: () => Promise<unknown>) => callback()),
    };

    const transactionPersistenceRepository = {
      insert: vi.fn().mockResolvedValue(101),
      update: vi.fn(),
    };

    const installmentPersistenceRepository = {
      replaceByTransactionId: vi.fn().mockResolvedValue([
        { id: 1001, installmentNumber: 1, status: 'paid' },
        { id: 1002, installmentNumber: 2, status: 'scheduled' },
      ]),
    };

    const payerPersistenceRepository = {
      upsertFromSnapshot: vi.fn().mockResolvedValue(501),
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    };

    const syncCheckpointRepository = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const idempotencyRepository = {
      findTransactionByKey: vi.fn().mockResolvedValue(null),
      registerDecision: vi.fn().mockResolvedValue(undefined),
    };

    const outboxRepository = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    const syncAuditRepository = {
      createSyncItem: vi.fn().mockResolvedValue(9001),
      addRawPayload: vi.fn().mockResolvedValue(9101),
      updateSyncItem: vi.fn().mockResolvedValue(undefined),
      addIntegrationError: vi.fn(),
      addProcessingError: vi.fn(),
    };

    const transactionAuditRepository = {
      recordTransactionIntegrationEvidence: vi.fn().mockResolvedValue(7001),
      recordTransactionEvent: vi.fn().mockResolvedValue(7002),
      recordTransactionStatusHistory: vi.fn().mockResolvedValue(7003),
      recordInstallmentStatusHistory: vi.fn().mockResolvedValue(undefined),
    };

    const service = new SyncPersistenceService(
      unitOfWork as never,
      transactionPersistenceRepository as never,
      installmentPersistenceRepository as never,
      payerPersistenceRepository as never,
      syncCheckpointRepository as never,
      idempotencyRepository as never,
      outboxRepository as never,
      syncAuditRepository as never,
      transactionAuditRepository as never,
    );

    const syncItemId = await service.registerIncomingItem({
      syncRunDbId: 100,
      psp: PspType.PAGARME,
      externalId: 'or_success_1',
      resourceType: 'transaction',
      rawPayload: {
        id: 'or_success_1',
        customer: {
          document: '12345678901',
        },
      },
    });

    const result = await service.persistTransaction({
      transaction: createTransaction(),
      lastSyncAt: new Date('2026-04-22T10:01:00.000Z'),
      checkpoint: {
        psp: PspType.PAGARME,
        page: 1,
        lastSyncAt: new Date('2026-04-22T10:01:00.000Z'),
      },
      syncRunId: 100,
      correlationId: 'corr-success',
    });

    await service.completeIncomingItem({
      syncItemId: syncItemId!,
      processingResult: 'inserted',
      transactionId: result.transactionId,
    });

    expect(syncItemId).toBe(9001);
    expect(syncAuditRepository.createSyncItem).toHaveBeenCalledTimes(1);
    expect(syncAuditRepository.addRawPayload).toHaveBeenCalledTimes(1);
    expect(transactionPersistenceRepository.insert).toHaveBeenCalledTimes(1);
    expect(installmentPersistenceRepository.replaceByTransactionId).toHaveBeenCalledTimes(1);
    expect(payerPersistenceRepository.upsertFromSnapshot).toHaveBeenCalledTimes(1);
    expect(payerPersistenceRepository.saveSnapshot).toHaveBeenCalledTimes(1);
    expect(syncCheckpointRepository.save).toHaveBeenCalledTimes(1);
    expect(idempotencyRepository.registerDecision).toHaveBeenCalledWith({
      key: {
        psp: 'pagarme',
        externalId: 'or_success_1',
      },
      decision: 'inserted',
    });
    expect(outboxRepository.add).toHaveBeenCalledTimes(1);
    expect(transactionAuditRepository.recordTransactionIntegrationEvidence).toHaveBeenCalledTimes(
      1,
    );
    expect(transactionAuditRepository.recordTransactionEvent).toHaveBeenCalledTimes(1);
    expect(transactionAuditRepository.recordTransactionStatusHistory).toHaveBeenCalledTimes(1);
    expect(transactionAuditRepository.recordInstallmentStatusHistory).toHaveBeenCalledTimes(1);
    expect(syncAuditRepository.updateSyncItem).toHaveBeenLastCalledWith(
      expect.objectContaining({
        syncItemId: 9001,
        processingResult: 'inserted',
        transactionId: 101,
      }),
    );
    expect(result).toEqual({
      transactionId: 101,
      decision: 'inserted',
    });
  });

  it('deve manter idempotência ao reimportar e auditar como updated', async () => {
    const unitOfWork = {
      execute: vi.fn(async (callback: () => Promise<unknown>) => callback()),
    };

    const transactionPersistenceRepository = {
      insert: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    };

    const installmentPersistenceRepository = {
      replaceByTransactionId: vi.fn().mockResolvedValue([
        { id: 2001, installmentNumber: 1, status: 'paid' },
        { id: 2002, installmentNumber: 2, status: 'scheduled' },
      ]),
    };

    const payerPersistenceRepository = {
      upsertFromSnapshot: vi.fn().mockResolvedValue(777),
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    };

    const syncCheckpointRepository = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const existingTransaction = createTransaction();
    const persistedExistingTransaction = {
      ...existingTransaction,
      id: 555,
    };

    const idempotencyRepository = {
      findTransactionByKey: vi.fn().mockResolvedValue({
        transaction: persistedExistingTransaction,
      }),
      registerDecision: vi.fn().mockResolvedValue(undefined),
    };

    const outboxRepository = {
      add: vi.fn().mockResolvedValue(undefined),
    };

    const syncAuditRepository = {
      createSyncItem: vi.fn().mockResolvedValue(9901),
      addRawPayload: vi.fn().mockResolvedValue(9902),
      updateSyncItem: vi.fn().mockResolvedValue(undefined),
      addIntegrationError: vi.fn(),
      addProcessingError: vi.fn(),
    };

    const transactionAuditRepository = {
      recordTransactionIntegrationEvidence: vi.fn().mockResolvedValue(8001),
      recordTransactionEvent: vi.fn().mockResolvedValue(8002),
      recordTransactionStatusHistory: vi.fn().mockResolvedValue(8003),
      recordInstallmentStatusHistory: vi.fn().mockResolvedValue(undefined),
    };

    const service = new SyncPersistenceService(
      unitOfWork as never,
      transactionPersistenceRepository as never,
      installmentPersistenceRepository as never,
      payerPersistenceRepository as never,
      syncCheckpointRepository as never,
      idempotencyRepository as never,
      outboxRepository as never,
      syncAuditRepository as never,
      transactionAuditRepository as never,
    );

    const result = await service.persistTransaction({
      transaction: existingTransaction,
      lastSyncAt: existingTransaction.updatedAt,
      checkpoint: {
        psp: PspType.PAGARME,
        page: 1,
        lastSyncAt: existingTransaction.updatedAt,
      },
      syncRunId: 100,
      correlationId: 'corr-reimport',
    });

    expect(transactionPersistenceRepository.insert).not.toHaveBeenCalled();
    expect(transactionPersistenceRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      transactionId: 555,
      decision: 'updated',
    });
    expect(idempotencyRepository.registerDecision).toHaveBeenCalledWith({
      key: {
        psp: 'pagarme',
        externalId: 'or_success_1',
      },
      decision: 'updated',
    });
    expect(transactionAuditRepository.recordTransactionIntegrationEvidence).toHaveBeenCalledTimes(
      1,
    );
    expect(transactionAuditRepository.recordTransactionEvent).toHaveBeenCalledTimes(1);
  });
});
