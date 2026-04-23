import {
  logExternalDependencyFailure,
  logExternalDependencyRateLimited,
  logExternalDependencyRetry,
  logExternalDependencySuccess,
} from '../../../../../app/server/logging/externalDependencyLogger';
import { IntegrationError, ValidationError } from '../../../../shared/application/errors';
import { PspType } from '../../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import { PayloadSanitizer } from '../../../../shared/infrastructure/security/PayloadSanitizer';
import { ResiliencePolicy } from '../../resilience/ResiliencePolicy';
import {
  type PagarmeListOrdersParams,
  type PagarmeListOrdersResponse,
  type PagarmeOrderResponse,
  isPagarmeListOrdersResponse,
  isPagarmeOrderResponse,
} from './pagarme.schemas';

export type PagarmeHttpClientConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
    jitterFactor: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxAttempts?: number;
  };
};

export class PagarmeHttpClient {
  private readonly resiliencePolicy: ResiliencePolicy;

  public constructor(private readonly config: PagarmeHttpClientConfig) {
    this.validateConfig();

    this.resiliencePolicy = new ResiliencePolicy({
      timeoutMs: this.config.timeoutMs,
      retry: this.config.retry,
      circuitBreaker: this.config.circuitBreaker,
    });
  }

  public async listOrders(params: PagarmeListOrdersParams): Promise<PagarmeListOrdersResponse> {
    if (!Number.isInteger(params.page) || params.page <= 0) {
      throw new ValidationError({
        message: 'Invalid Pagar.me page parameter',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          field: 'page',
          value: params.page,
        },
      });
    }

    if (!Number.isInteger(params.size) || params.size <= 0) {
      throw new ValidationError({
        message: 'Invalid Pagar.me size parameter',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          field: 'size',
          value: params.size,
        },
      });
    }

    const path = `/core/v5/orders?page=${params.page}&size=${params.size}`;
    const startedAt = Date.now();

    try {
      const response = await this.resiliencePolicy.execute(
        async () => {
          return this.request<unknown>(path);
        },
        {
          psp: PspType.PAGARME,
          operation: 'list_orders',
          endpoint: '/core/v5/orders',
          onRetry: async (retryParams) => {
            logExternalDependencyRetry({
              provider: PspType.PAGARME,
              operation: 'list_orders',
              endpoint: '/core/v5/orders',
              attempt: retryParams.attempt,
              maxAttempts: retryParams.maxAttempts,
              delayMs: retryParams.delayMs,
              error: retryParams.error,
              context: {
                page: params.page,
                size: params.size,
              },
            });
          },
          onRateLimited: async (rateLimitParams) => {
            logExternalDependencyRateLimited({
              provider: PspType.PAGARME,
              operation: 'list_orders',
              endpoint: '/core/v5/orders',
              retryAfterMs: rateLimitParams.retryAfterMs,
              context: {
                page: params.page,
                size: params.size,
              },
            });
          },
        },
      );

      if (!isPagarmeListOrdersResponse(response)) {
        throw new IntegrationError({
          message: 'Invalid Pagar.me list orders response',
          code: ErrorCode.INTEGRATION_ERROR,
          details: {
            provider: PspType.PAGARME,
            operation: 'list_orders',
          },
        });
      }

      this.logSuccess({
        operation: 'list_orders',
        endpoint: '/core/v5/orders',
        startedAt,
        context: {
          page: params.page,
          size: params.size,
          itemCount: response.data?.length ?? 0,
        },
      });

      return response;
    } catch (error) {
      this.logFailure({
        operation: 'list_orders',
        endpoint: '/core/v5/orders',
        startedAt,
        error,
        context: {
          page: params.page,
          size: params.size,
        },
      });

      throw error;
    }
  }

  public async getOrderById(orderId: string): Promise<PagarmeOrderResponse> {
    if (!orderId?.trim()) {
      throw new ValidationError({
        message: 'Invalid Pagar.me order id',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          field: 'orderId',
          value: orderId,
        },
      });
    }

    const normalizedOrderId = orderId.trim();
    const path = `/core/v5/orders/${encodeURIComponent(normalizedOrderId)}`;
    const startedAt = Date.now();

    try {
      const response = await this.resiliencePolicy.execute(
        async () => {
          return this.request<unknown>(path);
        },
        {
          psp: PspType.PAGARME,
          operation: 'get_order_by_id',
          endpoint: '/core/v5/orders/:id',
          onRetry: async (retryParams) => {
            logExternalDependencyRetry({
              provider: PspType.PAGARME,
              operation: 'get_order_by_id',
              endpoint: '/core/v5/orders/:id',
              attempt: retryParams.attempt,
              maxAttempts: retryParams.maxAttempts,
              delayMs: retryParams.delayMs,
              error: retryParams.error,
              context: {
                orderId: normalizedOrderId,
              },
            });
          },
          onRateLimited: async (rateLimitParams) => {
            logExternalDependencyRateLimited({
              provider: PspType.PAGARME,
              operation: 'get_order_by_id',
              endpoint: '/core/v5/orders/:id',
              retryAfterMs: rateLimitParams.retryAfterMs,
              context: {
                orderId: normalizedOrderId,
              },
            });
          },
        },
      );

      if (!isPagarmeOrderResponse(response)) {
        throw new IntegrationError({
          message: 'Invalid Pagar.me order response',
          code: ErrorCode.INTEGRATION_ERROR,
          details: {
            provider: PspType.PAGARME,
            operation: 'get_order_by_id',
            orderId: normalizedOrderId,
          },
        });
      }

      this.logSuccess({
        operation: 'get_order_by_id',
        endpoint: '/core/v5/orders/:id',
        startedAt,
        context: {
          orderId: normalizedOrderId,
          externalId: response.id,
        },
      });

      return response;
    } catch (error) {
      this.logFailure({
        operation: 'get_order_by_id',
        endpoint: '/core/v5/orders/:id',
        startedAt,
        error,
        context: {
          orderId: normalizedOrderId,
        },
      });

      throw error;
    }
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}${path}`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Basic ${this.encodeApiKey()}`,
        },
      });
    } catch (error) {
      throw new IntegrationError({
        message: 'Failed to call Pagar.me API',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          url,
        },
        cause: error,
      });
    }

    if (!response.ok) {
      const safeBody = await this.readSafeErrorBody(response);

      throw new IntegrationError({
        message: 'Pagar.me API returned an unsuccessful response',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          statusCode: response.status,
          url,
          body: safeBody,
        },
      });
    }

    return (await response.json()) as T;
  }

  private async readSafeErrorBody(response: Response): Promise<unknown> {
    try {
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const body = await response.json();
        return PayloadSanitizer.sanitize(body);
      }

      const text = await response.text();
      return PayloadSanitizer.sanitize({
        raw: text,
      });
    } catch {
      return undefined;
    }
  }

  private encodeApiKey(): string {
    return Buffer.from(`${this.config.apiKey}:`).toString('base64');
  }

  private validateConfig(): void {
    if (!this.config.baseUrl?.trim()) {
      throw new ValidationError({
        message: 'Pagar.me baseUrl is required',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          field: 'baseUrl',
        },
      });
    }

    if (!this.config.apiKey?.trim()) {
      throw new ValidationError({
        message: 'Pagar.me apiKey is required',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.PAGARME,
          field: 'apiKey',
        },
      });
    }
  }

  private logSuccess(params: {
    operation: string;
    endpoint: string;
    startedAt: number;
    context?: Record<string, unknown>;
  }): void {
    logExternalDependencySuccess({
      provider: PspType.PAGARME,
      operation: params.operation,
      endpoint: params.endpoint,
      startedAt: params.startedAt,
      context: params.context,
    });
  }

  private logFailure(params: {
    operation: string;
    endpoint: string;
    startedAt: number;
    error: unknown;
    context?: Record<string, unknown>;
  }): void {
    logExternalDependencyFailure({
      provider: PspType.PAGARME,
      operation: params.operation,
      endpoint: params.endpoint,
      startedAt: params.startedAt,
      error: params.error,
      context: params.context,
    });
  }
}
