export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerConfig = {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxAttempts?: number;
};

export type CircuitBreakerSnapshot = {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  openedAt?: number;
};

export class CircuitBreakerOpenError extends Error {
  public constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private openedAt?: number;
  private halfOpenAttempts = 0;
  private readonly config: Required<CircuitBreakerConfig>;

  public constructor(config: CircuitBreakerConfig) {
    this.config = {
      ...config,
      halfOpenMaxAttempts: config.halfOpenMaxAttempts ?? 1,
    };
  }

  public getState(): CircuitBreakerState {
    this.tryMoveToHalfOpen();
    return this.state;
  }

  public getSnapshot(): CircuitBreakerSnapshot {
    this.tryMoveToHalfOpen();

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      openedAt: this.openedAt,
    };
  }

  public canExecute(): boolean {
    this.tryMoveToHalfOpen();

    if (this.state === 'open') {
      return false;
    }

    if (this.state === 'half_open' && this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
      return false;
    }

    if (this.state === 'half_open') {
      this.halfOpenAttempts += 1;
    }

    return true;
  }

  public recordSuccess(): void {
    if (this.state === 'half_open') {
      this.reset();
      return;
    }

    this.successCount += 1;
    this.failureCount = 0;
  }

  public recordFailure(): void {
    this.failureCount += 1;

    if (this.state === 'half_open') {
      this.open();
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError();
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private open(): void {
    this.state = 'open';
    this.openedAt = Date.now();
    this.halfOpenAttempts = 0;
  }

  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = undefined;
    this.halfOpenAttempts = 0;
  }

  private tryMoveToHalfOpen(): void {
    if (this.state !== 'open' || !this.openedAt) {
      return;
    }

    const elapsedMs = Date.now() - this.openedAt;

    if (elapsedMs >= this.config.recoveryTimeoutMs) {
      this.state = 'half_open';
      this.halfOpenAttempts = 0;
    }
  }
}
