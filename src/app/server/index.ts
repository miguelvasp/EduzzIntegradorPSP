import { createServer } from './createServer';

async function bootstrap() {
  try {
    const [{ buildContainer }, { config }] = await Promise.all([
      import('../container/index.js'),
      import('../config/env.js'),
    ]);

    buildContainer();

    const app = createServer();

    await app.listen({
      host: config.app.host,
      port: config.app.port,
    });

    app.log.info(`Server running at http://${config.app.host}:${config.app.port}`);
  } catch (error) {
    console.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
