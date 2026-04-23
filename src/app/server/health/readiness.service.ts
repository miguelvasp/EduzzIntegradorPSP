import { getSqlRequest } from '../../../modules/shared/infrastructure/persistence/SqlServerConnection';
import { appLogger } from '../logging';

export type DependencyCheckStatus = 'ok' | 'failed';

export type ReadinessResponse = {
  status: 'ready' | 'not_ready';
  checks: {
    app: DependencyCheckStatus;
    database: DependencyCheckStatus;
  };
};

type DatabaseReadinessRow = {
  ready: number;
};

export class ReadinessService {
  public async check(): Promise<ReadinessResponse> {
    try {
      const request = await getSqlRequest();
      const result = await request.query<DatabaseReadinessRow>('SELECT 1 AS ready');

      const isDatabaseReady = (result.recordset[0]?.ready ?? 0) === 1;

      if (!isDatabaseReady) {
        this.logReadinessFailure('Database readiness query returned an unexpected result');

        return {
          status: 'not_ready',
          checks: {
            app: 'ok',
            database: 'failed',
          },
        };
      }

      return {
        status: 'ready',
        checks: {
          app: 'ok',
          database: 'ok',
        },
      };
    } catch (error) {
      this.logReadinessFailure(
        error instanceof Error ? error.message : 'Unknown database connectivity error',
      );

      return {
        status: 'not_ready',
        checks: {
          app: 'ok',
          database: 'failed',
        },
      };
    }
  }

  private logReadinessFailure(errorMessage: string): void {
    appLogger.warn({
      eventType: 'readiness',
      message: 'Readiness check failed',
      status: 'failed',
      module: 'server',
      component: 'readiness',
      context: {
        dependency: 'database',
        errorMessage,
      },
    });
  }
}
