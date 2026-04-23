import 'dotenv/config';
import { runSyncCli } from './sync.cli';

async function bootstrap(): Promise<void> {
  const exitCode = await runSyncCli(process.argv);
  process.exitCode = exitCode;
}

void bootstrap();
