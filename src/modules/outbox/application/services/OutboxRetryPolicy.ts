export class OutboxRetryPolicy {
  public constructor(
    private readonly config: {
      maxRetries: number;
      baseDelaySeconds: number;
    },
  ) {}

  public isRetriable(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('temporar') ||
      message.includes('unavailable') ||
      message.includes('transient')
    );
  }

  public shouldRetry(currentRetryCount: number, error: unknown): boolean {
    if (!this.isRetriable(error)) {
      return false;
    }

    return currentRetryCount < this.config.maxRetries;
  }

  public getNextAttemptAt(currentRetryCount: number, now: Date): string {
    const multiplier = currentRetryCount + 1;
    const delaySeconds = this.config.baseDelaySeconds * multiplier;

    return new Date(now.getTime() + delaySeconds * 1000).toISOString();
  }
}
