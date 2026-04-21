export type SyncWindowCalculatorConfig = {
  initialLookbackMinutes: number;
  overlapMinutes: number;
};

export type CalculatedSyncWindow = {
  from: Date;
  to: Date;
};

export class SyncWindowCalculator {
  public constructor(private readonly config: SyncWindowCalculatorConfig) {}

  public calculate(params: { now: Date; checkpointLastSyncAt?: Date }): CalculatedSyncWindow {
    const to = params.now;

    if (!params.checkpointLastSyncAt) {
      return {
        from: new Date(to.getTime() - this.config.initialLookbackMinutes * 60 * 1000),
        to,
      };
    }

    return {
      from: new Date(
        params.checkpointLastSyncAt.getTime() - this.config.overlapMinutes * 60 * 1000,
      ),
      to,
    };
  }
}
