import { describe, expect, it, vi } from 'vitest';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import type { SyncExecutionContext } from '../../modules/sync/application/dto/SyncExecutionContext';
import { SyncPageProcessor } from '../../modules/sync/application/services/SyncPageProcessor';
import { SyncProgressTracker } from '../../modules/sync/application/services/SyncProgressTracker';
import { createDocumentHashValueObject } from '../../modules/transactions/domain/value-objects/document-hash.value-object';
import { createExternalTransactionReferenceValueObject } from '../../modules/transactions/domain/value-objects/external-transaction-reference.value-object';
import { createMoneyValueObject } from '../../modules/transactions/domain/value-objects/money.value-object';

describe('SyncPageProcessor', () => {
  function createContext(): SyncExecutionContext {
    return {
      syncRunId: 'sync-run-1',
      syncRunDbId: 100,
      correlationId: 'corr-1',
      triggeredBy: 'cli',
      targetPsp: PspType.PAGARME,
      startedAt: new Date('2026-04-21T10:00:00.000Z'),
      mode: 'standard',
      verbose: false,
      pageLimit: 1,
      itemLimit: 20,
      dryRun: false,
    };
  }

  function createTransaction() {
    return {
      id: 0,
      externalReference: createExternalTransactionReferenceValueObject({
        psp: 'pagarme',
        externalId: 'or_1',
      }),
      paymentMethod: 'credit_card' as const,
      status: 'paid' as const,
      originalAmount: createMoneyValueObject({ amountInCents: 10000 }),
      netAmount: createMoneyValueObject({ amountInCents: 9700 }),
      fees: createMoneyValueObject({ amountInCents: 300 }),
      installmentCount: 2,
      currency: 'BRL',
      createdAt: new Date('2026-04-21T10:00:00.000Z'),
      updatedAt: new Date('2026-04-21T10:01:00.000Z'),
      payerSnapshot: {
        externalId: 'cus_1',
        name: 'Maria',
        email: 'maria@example.com',
        documentHash: createDocumentHashValueObject('hash_sync_page_processor_123456'),
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

  it('deve registrar item recebido e concluir como inserted no caminho feliz', async () => {
    const tracker = new SyncProgressTracker();
    const syncPersistenceService = {
      registerIncomingItem: vi.fn().mockResolvedValue(9001),
      persistTransaction: vi.fn().mockResolvedValue({
        transactionId: 101,
        decision: 'inserted',
      }),
      completeIncomingItem: vi.fn().mockResolvedValue(undefined),
      failIncomingItem: vi.fn(),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn(),
    };

    const processor = new SyncPageProcessor(
      tracker,
      syncPersistenceService as never,
      undefined,
      undefined,
    );

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi.fn().mockReturnValue(createTransaction()),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: 'or_1' }],
      context: createContext(),
      dryRun: false,
      page: 1,
    });

    expect(syncPersistenceService.registerIncomingItem).toHaveBeenCalledTimes(1);
    expect(syncPersistenceService.persistTransaction).toHaveBeenCalledTimes(1);
    expect(syncPersistenceService.completeIncomingItem).toHaveBeenCalledWith({
      syncItemId: 9001,
      processingResult: 'inserted',
      transactionId: 101,
    });
    expect(syncPersistenceService.failIncomingItem).not.toHaveBeenCalled();
    expect(tracker.getSnapshot()).toEqual({
      currentPsp: undefined,
      pagesProcessed: 0,
      itemsRead: 1,
      itemsProcessed: 1,
      itemsFailed: 0,
    });
  });

  it('deve respeitar dryRun sem adaptar itens nem persistir', async () => {
    const tracker = new SyncProgressTracker();
    const syncPersistenceService = {
      registerIncomingItem: vi.fn(),
      persistTransaction: vi.fn(),
      completeIncomingItem: vi.fn(),
      failIncomingItem: vi.fn(),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn(),
    };

    const processor = new SyncPageProcessor(
      tracker,
      syncPersistenceService as never,
      undefined,
      undefined,
    );

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi.fn(),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: '1' }],
      context: createContext(),
      dryRun: true,
    });

    expect(strategy.adapt).not.toHaveBeenCalled();
    expect(syncPersistenceService.registerIncomingItem).not.toHaveBeenCalled();
    expect(syncPersistenceService.persistTransaction).not.toHaveBeenCalled();
    expect(tracker.getSnapshot().itemsProcessed).toBe(1);
  });

  it('deve registrar falha de item sem interromper os demais', async () => {
    const tracker = new SyncProgressTracker();
    const syncPersistenceService = {
      registerIncomingItem: vi.fn().mockResolvedValueOnce(9101).mockResolvedValueOnce(9102),
      persistTransaction: vi
        .fn()
        .mockRejectedValueOnce(new Error('Missing payer data'))
        .mockResolvedValueOnce({
          transactionId: 202,
          decision: 'updated',
        }),
      completeIncomingItem: vi.fn().mockResolvedValue(undefined),
      failIncomingItem: vi.fn().mockResolvedValue(undefined),
      registerIntegrationError: vi.fn(),
      registerProcessingError: vi.fn(),
    };

    const syncRejectionRecorder = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    const syncConflictRecorder = {
      record: vi.fn(),
    };

    const processor = new SyncPageProcessor(
      tracker,
      syncPersistenceService as never,
      syncRejectionRecorder as never,
      syncConflictRecorder as never,
    );

    const strategy = {
      getPsp: vi.fn().mockReturnValue(PspType.PAGARME),
      adapt: vi
        .fn()
        .mockReturnValueOnce(createTransaction())
        .mockReturnValueOnce(createTransaction()),
    };

    await processor.processPage({
      strategy: strategy as never,
      items: [{ id: 'or_fail_1' }, { id: 'or_ok_2' }],
      context: createContext(),
      dryRun: false,
    });

    expect(syncPersistenceService.registerIncomingItem).toHaveBeenCalledTimes(2);
    expect(syncPersistenceService.failIncomingItem).toHaveBeenCalledWith({
      syncItemId: 9101,
    });
    expect(syncRejectionRecorder.record).toHaveBeenCalledTimes(1);
    expect(syncPersistenceService.completeIncomingItem).toHaveBeenCalledWith({
      syncItemId: 9102,
      processingResult: 'updated',
      transactionId: 202,
    });
    expect(tracker.getSnapshot()).toEqual({
      currentPsp: undefined,
      pagesProcessed: 0,
      itemsRead: 2,
      itemsProcessed: 1,
      itemsFailed: 1,
    });
  });
});
