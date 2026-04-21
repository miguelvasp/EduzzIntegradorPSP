export type RateLimitHeaders = Record<string, string | string[] | undefined>;

export type RateLimitResult = {
  isRateLimited: boolean;
  retryAfterMs?: number;
};

export class RateLimitHandler {
  public isRateLimited(statusCode?: number): boolean {
    return statusCode === 429;
  }

  public getRetryAfterMs(headers?: RateLimitHeaders): number | undefined {
    if (!headers) {
      return undefined;
    }

    const rawValue = headers['retry-after'];

    if (typeof rawValue === 'string') {
      return this.parseRetryAfter(rawValue);
    }

    if (Array.isArray(rawValue) && rawValue.length > 0) {
      return this.parseRetryAfter(rawValue[0]);
    }

    return undefined;
  }

  public analyze(params: { statusCode?: number; headers?: RateLimitHeaders }): RateLimitResult {
    const isRateLimited = this.isRateLimited(params.statusCode);

    if (!isRateLimited) {
      return {
        isRateLimited: false,
      };
    }

    return {
      isRateLimited: true,
      retryAfterMs: this.getRetryAfterMs(params.headers),
    };
  }

  private parseRetryAfter(value: string): number | undefined {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return undefined;
    }

    const seconds = Number(trimmedValue);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1000;
    }

    const retryDateMs = Date.parse(trimmedValue);

    if (Number.isNaN(retryDateMs)) {
      return undefined;
    }

    const diffMs = retryDateMs - Date.now();

    return diffMs > 0 ? diffMs : 0;
  }
}
