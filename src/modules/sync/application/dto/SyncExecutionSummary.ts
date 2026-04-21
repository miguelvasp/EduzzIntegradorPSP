export class SyncExecutionSummary {
  private totalRead = 0;
  private totalSucceeded = 0;
  private totalRejected = 0;
  private totalConflicted = 0;
  private totalFailed = 0;
  private totalGlobalFailures = 0;

  public recordRead(): void {
    this.totalRead += 1;
  }

  public recordSuccess(): void {
    this.totalSucceeded += 1;
  }

  public recordRejected(): void {
    this.totalRejected += 1;
  }

  public recordConflicted(): void {
    this.totalConflicted += 1;
  }

  public recordFailed(): void {
    this.totalFailed += 1;
  }

  public recordGlobalFailure(): void {
    this.totalGlobalFailures += 1;
  }

  public getSnapshot() {
    return {
      totalRead: this.totalRead,
      totalSucceeded: this.totalSucceeded,
      totalRejected: this.totalRejected,
      totalConflicted: this.totalConflicted,
      totalFailed: this.totalFailed,
      totalGlobalFailures: this.totalGlobalFailures,
    };
  }
}
