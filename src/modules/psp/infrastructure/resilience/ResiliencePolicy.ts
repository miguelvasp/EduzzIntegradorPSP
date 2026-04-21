import { IntegrationError } from '../../../shared/application/errors';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  type CircuitBreakerConfig,
} from './CircuitBreaker';
import { RateLimitHandler, type RateLimitHeaders } from './RateLimitHandler';
import { RetryPolicy, type RetryExecutionContext, type RetryPolicyConfig } from './RetryPolicy';

export type ResiliencePolicyConfig = {
  timeoutMs: number;
  retry: RetryPolicyConfig;
  circuitBreaker: CircuitBreakerConfig;
};

export type ResilienceExecutionContext = RetryExecutionContext & {
  headers?: RateLimitHeaders;
  onRetry?: (params: {
    attempt: number;
    maxAttempts: number;
    delayMs: number;
    error: unknown;
    context: RetryExecutionContext;
  }) => void | Promise<void>;
  onGiveUp?: (params: {
    attempt: number;
    maxAttempts: number;
    error: unknown;
    context: RetryExecutionContext;
  }) => void | Promise<void>;
  onRateLimited?: (params: {
    retryAfterMs?: number;
    context: RetryExecutionContext;
  }) => void | Promise<void>;
};

type ErrorWithStatusCode = {
  statusCode?: number;
  status?: number;
  response?: {
    status?: number;
    headers?: RateLimitHeaders;
  };
};

export class ResiliencePolicy {
  private readonly timeoutMs: number;
  private readonly retryPolicy: RetryPolicy;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimitHandler: RateLimitHandler;

  public constructor(config: ResiliencePolicyConfig) {
    this.timeoutMs = config.timeoutMs;
    this.retryPolicy = new RetryPolicy(config.retry);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.rateLimitHandler = new RateLimitHandler();
  }

  public getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  public getRetryPolicy(): RetryPolicy {
    return this.retryPolicy;
  }

  public async execute<T>(
    operation: () => Promise<T>,
    context: ResilienceExecutionContext,
  ): Promise<T> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return this.retryPolicy.execute(async () => this.executeWithTimeout(operation), context, {
          onRetry: async (params) => {
            await context.onRetry?.(params);
          },
          onGiveUp: async (params) => {
            await this.handleRateLimit(params.error, context);
            await context.onGiveUp?.(params);
          },
        });
      });
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        throw new IntegrationError({
          message: 'External integration temporarily unavailable due to open circuit',
          details: {
            psp: context.psp,
            operation: context.operation,
            endpoint: context.endpoint,
            circuitState: this.circuitBreaker.getState(),
          },
          cause: error,
        });
      }

      if (error instanceof IntegrationError) {
        throw error;
      }

      throw new IntegrationError({
        message: 'External integration failed',
        details: {
          psp: context.psp,
          operation: context.operation,
          endpoint: context.endpoint,
          circuitState: this.circuitBreaker.getState(),
        },
        cause: error,
      });
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            const timeoutError = new Error('External integration timed out');
            timeoutError.name = 'TimeoutError';
            reject(timeoutError);
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async handleRateLimit(
    error: unknown,
    context: ResilienceExecutionContext,
  ): Promise<void> {
    const normalized = error as ErrorWithStatusCode | undefined;

    const statusCode = normalized?.statusCode ?? normalized?.status ?? normalized?.response?.status;

    const headers = normalized?.response?.headers ?? context.headers;
    const result = this.rateLimitHandler.analyze({
      statusCode,
      headers,
    });

    if (!result.isRateLimited) {
      return;
    }

    await context.onRateLimited?.({
      retryAfterMs: result.retryAfterMs,
      context,
    });
  }
}
