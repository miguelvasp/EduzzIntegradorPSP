import { describe, expect, it, vi } from 'vitest';
import {
  DomainError,
  IntegrationError,
  ValidationError,
} from '../../modules/shared/application/errors';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ErrorCode } from '../../modules/shared/domain/error-codes/errorCode';
import { ItemFailureHandler } from '../../modules/sync/application/services/ItemFailureHandler';
import { ItemProcessingExecutor } from '../../modules/sync/application/services/ItemProcessingExecutor';

describe('ItemProcessingExecutor', () => {
  it('deve retornar sucesso quando ação concluir', async () => {
    const executor = new ItemProcessingExecutor(new ItemFailureHandler());

    const result = await executor.execute({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      action: async () => undefined,
    });

    expect(result).toEqual({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      status: 'processed_successfully',
      shouldContinue: true,
    });
  });

  it('deve isolar ValidationError como rejected', async () => {
    const executor = new ItemProcessingExecutor(new ItemFailureHandler());

    const result = await executor.execute({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      action: () => {
        throw new ValidationError({
          message: 'Invalid transaction',
          code: ErrorCode.VALIDATION_ERROR,
        });
      },
    });

    expect(result.status).toBe('rejected');
    expect(result.shouldContinue).toBe(true);
  });

  it('deve isolar DomainError como conflicted', async () => {
    const executor = new ItemProcessingExecutor(new ItemFailureHandler());

    const result = await executor.execute({
      psp: PspType.MERCADO_PAGO,
      externalId: 'mp_1',
      syncRunId: 'sync-1',
      action: () => {
        throw new DomainError({
          message: 'Conflict detected',
          code: ErrorCode.DOMAIN_ERROR,
        });
      },
    });

    expect(result.status).toBe('conflicted');
    expect(result.shouldContinue).toBe(true);
  });

  it('deve isolar erro técnico como failed', async () => {
    const executor = new ItemProcessingExecutor(new ItemFailureHandler());

    const result = await executor.execute({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      action: () => {
        throw new IntegrationError({
          message: 'Database timeout',
          code: ErrorCode.INTEGRATION_ERROR,
        });
      },
    });

    expect(result.status).toBe('failed');
    expect(result.shouldContinue).toBe(true);
  });

  it('deve permitir continuidade entre itens mesmo após falha anterior', async () => {
    const executor = new ItemProcessingExecutor(new ItemFailureHandler());

    const firstResult = await executor.execute({
      psp: PspType.PAGARME,
      externalId: 'or_1',
      syncRunId: 'sync-1',
      action: () => {
        throw new Error('first failed');
      },
    });

    const secondAction = vi.fn().mockResolvedValue(undefined);

    const secondResult = await executor.execute({
      psp: PspType.PAGARME,
      externalId: 'or_2',
      syncRunId: 'sync-1',
      action: secondAction,
    });

    expect(firstResult.status).toBe('failed');
    expect(firstResult.shouldContinue).toBe(true);
    expect(secondAction).toHaveBeenCalledTimes(1);
    expect(secondResult.status).toBe('processed_successfully');
  });
});
