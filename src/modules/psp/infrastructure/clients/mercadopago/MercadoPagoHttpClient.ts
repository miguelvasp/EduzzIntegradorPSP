import { appLogger } from '../../../../../app/server/logging';
import { IntegrationError, ValidationError } from '../../../../shared/application/errors';
import { PspType } from '../../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../../shared/domain/error-codes/errorCode';
import { PayloadSanitizer } from '../../../../shared/infrastructure/security/PayloadSanitizer';
import { ResiliencePolicy } from '../../resilience/ResiliencePolicy';
import {
  isMercadoPagoPaymentResponse,
  isMercadoPagoSearchPaymentsResponse,
  type MercadoPagoPaymentResponse,
  type MercadoPagoSearchPaymentsParams,
  type MercadoPagoSearchPaymentsResponse,
} from './mercadopago.schemas';

export type MercadoPagoHttpClientConfig = {
  baseUrl: string;
  accessToken: string;
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

export class MercadoPagoHttpClient {
  private readonly resiliencePolicy: ResiliencePolicy;

  public constructor(private readonly config: MercadoPagoHttpClientConfig) {
    this.validateConfig();

    this.resiliencePolicy = new ResiliencePolicy({
      timeoutMs: this.config.timeoutMs,
      retry: this.config.retry,
      circuitBreaker: this.config.circuitBreaker,
    });
  }

  public async searchPayments(
    params: MercadoPagoSearchPaymentsParams,
  ): Promise<MercadoPagoSearchPaymentsResponse> {
    if (!Number.isInteger(params.offset) || params.offset < 0) {
      throw new ValidationError({
        message: 'Invalid Mercado Pago offset parameter',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          field: 'offset',
          value: params.offset,
        },
      });
    }

    if (!Number.isInteger(params.limit) || params.limit <= 0) {
      throw new ValidationError({
        message: 'Invalid Mercado Pago limit parameter',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          field: 'limit',
          value: params.limit,
        },
      });
    }

    const path = `/v1/payments/search?payment_type_id=credit_card&offset=${params.offset}&limit=${params.limit}`;
    const startedAt = Date.now();

    try {
      const response = await this.resiliencePolicy.execute(
        async () => this.request<unknown>(path),
        {
          psp: PspType.MERCADO_PAGO,
          operation: 'search_payments',
          endpoint: '/v1/payments/search',
        },
      );

      if (!isMercadoPagoSearchPaymentsResponse(response)) {
        throw new IntegrationError({
          message: 'Invalid Mercado Pago search payments response',
          code: ErrorCode.INTEGRATION_ERROR,
          details: {
            provider: PspType.MERCADO_PAGO,
            operation: 'search_payments',
          },
        });
      }

      this.logSuccess({
        operation: 'search_payments',
        endpoint: '/v1/payments/search',
        startedAt,
        context: {
          offset: params.offset,
          limit: params.limit,
          itemCount: response.results?.length ?? 0,
        },
      });

      return response;
    } catch (error) {
      this.logFailure({
        operation: 'search_payments',
        endpoint: '/v1/payments/search',
        startedAt,
        error,
        context: {
          offset: params.offset,
          limit: params.limit,
        },
      });

      throw error;
    }
  }

  public async getPaymentById(paymentId: string): Promise<MercadoPagoPaymentResponse> {
    if (!paymentId?.trim()) {
      throw new ValidationError({
        message: 'Invalid Mercado Pago payment id',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          field: 'paymentId',
          value: paymentId,
        },
      });
    }

    const normalizedPaymentId = paymentId.trim();
    const path = `/v1/payments/${encodeURIComponent(normalizedPaymentId)}`;
    const startedAt = Date.now();

    try {
      const response = await this.resiliencePolicy.execute(
        async () => this.request<unknown>(path),
        {
          psp: PspType.MERCADO_PAGO,
          operation: 'get_payment_by_id',
          endpoint: '/v1/payments/:id',
        },
      );

      if (!isMercadoPagoPaymentResponse(response)) {
        throw new IntegrationError({
          message: 'Invalid Mercado Pago payment response',
          code: ErrorCode.INTEGRATION_ERROR,
          details: {
            provider: PspType.MERCADO_PAGO,
            operation: 'get_payment_by_id',
            paymentId: normalizedPaymentId,
          },
        });
      }

      this.logSuccess({
        operation: 'get_payment_by_id',
        endpoint: '/v1/payments/:id',
        startedAt,
        context: {
          paymentId: normalizedPaymentId,
          externalId: response.id,
        },
      });

      return response;
    } catch (error) {
      this.logFailure({
        operation: 'get_payment_by_id',
        endpoint: '/v1/payments/:id',
        startedAt,
        error,
        context: {
          paymentId: normalizedPaymentId,
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
          authorization: `Bearer ${this.config.accessToken}`,
        },
      });
    } catch (error) {
      throw new IntegrationError({
        message: 'Failed to call Mercado Pago API',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          url,
        },
        cause: error,
      });
    }

    if (!response.ok) {
      const safeBody = await this.readSafeErrorBody(response);

      throw new IntegrationError({
        message: 'Mercado Pago API returned an unsuccessful response',
        code: ErrorCode.INTEGRATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
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

  private validateConfig(): void {
    if (!this.config.baseUrl?.trim()) {
      throw new ValidationError({
        message: 'Mercado Pago baseUrl is required',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          field: 'baseUrl',
        },
      });
    }

    if (!this.config.accessToken?.trim()) {
      throw new ValidationError({
        message: 'Mercado Pago accessToken is required',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          provider: PspType.MERCADO_PAGO,
          field: 'accessToken',
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
    appLogger.info({
      eventType: 'psp_http_client_success',
      message: 'Mercado Pago request completed',
      status: 'completed',
      durationMs: Date.now() - params.startedAt,
      context: {
        provider: PspType.MERCADO_PAGO,
        operation: params.operation,
        endpoint: params.endpoint,
        ...params.context,
      },
    });
  }

  private logFailure(params: {
    operation: string;
    endpoint: string;
    startedAt: number;
    error: unknown;
    context?: Record<string, unknown>;
  }): void {
    appLogger.error({
      eventType: 'psp_http_client_failure',
      message: 'Mercado Pago request failed',
      errorCode:
        params.error instanceof IntegrationError ? params.error.code : ErrorCode.INTEGRATION_ERROR,
      status: 'failed',
      durationMs: Date.now() - params.startedAt,
      context: PayloadSanitizer.sanitize({
        provider: PspType.MERCADO_PAGO,
        operation: params.operation,
        endpoint: params.endpoint,
        ...params.context,
        error:
          params.error instanceof Error
            ? {
                name: params.error.name,
                message: params.error.message,
              }
            : params.error,
      }) as Record<string, unknown>,
    });
  }
}
