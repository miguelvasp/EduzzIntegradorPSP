export type RetryableOperation<T> = (attempt: number) => Promise<T>;

export type RetryDelayStrategyParams = {
  attempt: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterFactor: number;
};

export type RetryPolicyConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterFactor: number;
  retryableStatusCodes?: number[];
};

export type RetryExecutionContext = {
  psp: string;
  operation: string;
  endpoint?: string;
};

export type RetryExecutionHooks = {
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
};

type ErrorWithStatusCode = {
  statusCode?: number;
  status?: number;
  response?: {
    status?: number;
  };
  code?: string;
  name?: string;
};

export class RetryPolicy {
  private readonly config: RetryPolicyConfig;

  public constructor(config: RetryPolicyConfig) {
    this.config = {
      ...config,
      retryableStatusCodes: config.retryableStatusCodes ?? [408, 425, 429, 500, 502, 503, 504],
    };
  }

  public getConfig(): RetryPolicyConfig {
    return { ...this.config };
  }

  public isRetryable(error: unknown): boolean {
    const normalized = error as ErrorWithStatusCode | undefined;

    const statusCode = normalized?.statusCode ?? normalized?.status ?? normalized?.response?.status;

    if (typeof statusCode === 'number' && this.config.retryableStatusCodes?.includes(statusCode)) {
      return true;
    }

    const code = normalized?.code?.toUpperCase();
    const name = normalized?.name?.toUpperCase();

    return (
      [
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        'EAI_AGAIN',
        'ENOTFOUND',
        'UND_ERR_CONNECT_TIMEOUT',
        'ABORT_ERR',
        'TIMEOUTERROR',
      ].includes(code ?? '') || ['TIMEOUTERROR', 'ABORTERROR'].includes(name ?? '')
    );
  }

  public calculateDelay(params: RetryDelayStrategyParams): number {
    const exponentialDelay =
      params.baseDelayMs * Math.pow(params.backoffFactor, params.attempt - 1);

    const cappedDelay = Math.min(exponentialDelay, params.maxDelayMs);
    const jitterAmplitude = cappedDelay * params.jitterFactor;
    const jitter = Math.random() * jitterAmplitude;

    return Math.round(cappedDelay + jitter);
  }

  public async execute<T>(
    operation: RetryableOperation<T>,
    context: RetryExecutionContext,
    hooks?: RetryExecutionHooks,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error;

        const retryable = this.isRetryable(error);
        const isLastAttempt = attempt >= this.config.maxAttempts;

        if (!retryable || isLastAttempt) {
          await hooks?.onGiveUp?.({
            attempt,
            maxAttempts: this.config.maxAttempts,
            error,
            context,
          });

          throw error;
        }

        const delayMs = this.calculateDelay({
          attempt,
          baseDelayMs: this.config.baseDelayMs,
          maxDelayMs: this.config.maxDelayMs,
          backoffFactor: this.config.backoffFactor,
          jitterFactor: this.config.jitterFactor,
        });

        await hooks?.onRetry?.({
          attempt,
          maxAttempts: this.config.maxAttempts,
          delayMs,
          error,
          context,
        });

        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  private async sleep(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
