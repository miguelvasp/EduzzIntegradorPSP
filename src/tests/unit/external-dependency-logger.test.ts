import { afterEach, describe, expect, it, vi } from 'vitest';
import { appLogger } from '../../app/server/logging';
import {
  logExternalDependencyFailure,
  logExternalDependencyRateLimited,
  logExternalDependencyRetry,
  logExternalDependencySuccess,
} from '../../app/server/logging/externalDependencyLogger';
import { IntegrationError } from '../../modules/shared/application/errors';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { ErrorCode } from '../../modules/shared/domain/error-codes/errorCode';

describe('externalDependencyLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve logar sucesso padronizado', () => {
    const infoSpy = vi.spyOn(appLogger, 'info').mockImplementation(() => undefined);

    logExternalDependencySuccess({
      provider: PspType.PAGARME,
      operation: 'list_orders',
      endpoint: '/core/v5/orders',
      startedAt: Date.now() - 25,
      context: {
        page: 1,
        size: 20,
      },
    });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'external_dependency_success',
        message: 'External dependency request completed',
        status: 'completed',
        durationMs: expect.any(Number),
        context: expect.objectContaining({
          provider: PspType.PAGARME,
          operation: 'list_orders',
          endpoint: '/core/v5/orders',
          page: 1,
          size: 20,
        }),
      }),
    );
  });

  it('deve logar retry padronizado', () => {
    const warnSpy = vi.spyOn(appLogger, 'warn').mockImplementation(() => undefined);

    logExternalDependencyRetry({
      provider: PspType.MERCADO_PAGO,
      operation: 'search_payments',
      endpoint: '/v1/payments/search',
      attempt: 2,
      maxAttempts: 3,
      delayMs: 200,
      error: new IntegrationError({
        message: 'retry upstream',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          statusCode: 503,
        },
      }),
      context: {
        offset: 0,
        limit: 20,
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'external_dependency_retry',
        message: 'External dependency request will be retried',
        status: 'retrying',
        context: expect.objectContaining({
          provider: PspType.MERCADO_PAGO,
          operation: 'search_payments',
          endpoint: '/v1/payments/search',
          attempt: 2,
          maxAttempts: 3,
          delayMs: 200,
          offset: 0,
          limit: 20,
        }),
      }),
    );
  });

  it('deve logar rate limit padronizado', () => {
    const warnSpy = vi.spyOn(appLogger, 'warn').mockImplementation(() => undefined);

    logExternalDependencyRateLimited({
      provider: PspType.PAGARME,
      operation: 'get_order_by_id',
      endpoint: '/core/v5/orders/:id',
      retryAfterMs: 1500,
      context: {
        orderId: 'or_123',
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'external_dependency_rate_limited',
        message: 'External dependency rate limited',
        status: 'rate_limited',
        context: expect.objectContaining({
          provider: PspType.PAGARME,
          operation: 'get_order_by_id',
          endpoint: '/core/v5/orders/:id',
          retryAfterMs: 1500,
          orderId: 'or_123',
        }),
      }),
    );
  });

  it('deve classificar timeout como falha retryable', () => {
    const errorSpy = vi.spyOn(appLogger, 'error').mockImplementation(() => undefined);

    logExternalDependencyFailure({
      provider: PspType.PAGARME,
      operation: 'list_orders',
      endpoint: '/core/v5/orders',
      startedAt: Date.now() - 40,
      error: new IntegrationError({
        message: 'External dependency timed out',
        code: ErrorCode.INTEGRATION_ERROR,
        cause: Object.assign(new Error('socket timeout'), {
          name: 'TimeoutError',
        }),
        details: {
          statusCode: 504,
        },
      }),
      context: {
        page: 1,
        size: 20,
      },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'external_dependency_failure',
        message: 'External dependency request failed',
        status: 'failed',
        durationMs: expect.any(Number),
        context: expect.objectContaining({
          provider: PspType.PAGARME,
          operation: 'list_orders',
          endpoint: '/core/v5/orders',
          errorClass: 'timeout',
          statusCode: 504,
          retryable: true,
          page: 1,
          size: 20,
        }),
      }),
    );
  });

  it('deve classificar 5xx upstream como indisponibilidade retryable', () => {
    const errorSpy = vi.spyOn(appLogger, 'error').mockImplementation(() => undefined);

    logExternalDependencyFailure({
      provider: PspType.MERCADO_PAGO,
      operation: 'search_payments',
      endpoint: '/v1/payments/search',
      startedAt: Date.now() - 55,
      error: new IntegrationError({
        message: 'Mercado Pago upstream failed',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          statusCode: 503,
        },
      }),
      context: {
        offset: 20,
        limit: 20,
      },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'external_dependency_failure',
        message: 'External dependency request failed',
        status: 'failed',
        durationMs: expect.any(Number),
        context: expect.objectContaining({
          provider: PspType.MERCADO_PAGO,
          operation: 'search_payments',
          endpoint: '/v1/payments/search',
          errorClass: 'upstream_5xx',
          statusCode: 503,
          retryable: true,
          offset: 20,
          limit: 20,
        }),
      }),
    );
  });
});
