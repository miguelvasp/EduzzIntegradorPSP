import { createServer } from './createServer';
import { appLogger } from './logging';

async function bootstrap() {
  try {
    const [{ buildContainer }, { config }] = await Promise.all([
      import('../container/index.js'),
      import('../config/env.js'),
    ]);

    appLogger.info({
      eventType: 'startup',
      message: 'Starting application',
      status: 'started',
    });

    buildContainer();

    const app = createServer();

    await app.listen({
      host: config.app.host,
      port: config.app.port,
    });

    appLogger.info({
      eventType: 'startup',
      message: `Server running at http://${config.app.host}:${config.app.port}`,
      status: 'completed',
    });
  } catch (error) {
    appLogger.error({
      eventType: 'startup',
      message: 'Failed to start application',
      status: 'failed',
      context: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    process.exit(1);
  }
}

void bootstrap();
