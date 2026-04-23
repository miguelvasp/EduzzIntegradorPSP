import { SyncCommandParser } from '../../modules/sync/application/services/SyncCommandParser';
import { buildContainer } from '../container';
import { appLogger } from '../server/logging';

export async function runSyncCli(
  argv: string[],
  dependencies?: {
    parser?: SyncCommandParser;
  },
): Promise<number> {
  const parser = dependencies?.parser ?? new SyncCommandParser();

  try {
    const parsed = parser.parse(argv);
    const container = await buildContainer();

    const context = container.syncExecutionFactory.create({
      targetPsp: parsed.targetPsp,
      triggeredBy: 'cli',
      mode: parsed.verbose ? 'verbose' : 'standard',
      verbose: parsed.verbose,
      pageLimit: parsed.pageLimit,
      itemLimit: parsed.itemLimit,
      dryRun: parsed.dryRun,
    });

    await container.runSyncUseCase.execute(context);

    return 0;
  } catch (error) {
    appLogger.error({
      eventType: 'sync_cli_failed',
      message: 'Sync CLI execution failed',
      status: 'failed',
      context: {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : error,
      },
    });

    return 1;
  }
}
