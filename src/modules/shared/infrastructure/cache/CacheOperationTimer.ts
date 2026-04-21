export class CacheOperationTimer {
  private readonly startedAt: number;

  public constructor() {
    this.startedAt = Date.now();
  }

  public elapsedMs(): number {
    return Math.max(0, Date.now() - this.startedAt);
  }
}
