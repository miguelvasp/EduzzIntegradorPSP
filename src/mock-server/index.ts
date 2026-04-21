import { createMockServer } from './app/createMockServer';

async function bootstrap() {
  const app = await createMockServer();
  const port = Number(process.env.MOCK_SERVER_PORT ?? '3334');
  const host = process.env.MOCK_SERVER_HOST ?? '0.0.0.0';

  await app.listen({
    port,
    host,
  });

  app.log.info({
    message: 'Mock server started',
    host,
    port,
  });
}

void bootstrap();
