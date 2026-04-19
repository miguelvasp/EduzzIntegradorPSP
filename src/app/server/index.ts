import { env } from '../config/env';
import { buildContainer } from '../container';
import { createServer } from './createServer';

async function bootstrap() {
  try {
    buildContainer();

    const app = createServer();

    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    app.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    console.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
