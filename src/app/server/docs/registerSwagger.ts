import swagger, { type FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import swaggerUi, { type FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { config } from '../../config/env';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  if (!config.app.docsEnabled) {
    return;
  }

  const swaggerOptions: FastifyDynamicSwaggerOptions = {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Eduzz Integrador PSP API',
        version: '1.0.0',
        description: 'API de consulta e sincronização do agregador de transações multi-PSP.',
      },
      servers: [
        {
          url: `http://localhost:${config.app.port}`,
          description: 'Ambiente local',
        },
      ],
    },
  };

  const swaggerUiOptions: FastifySwaggerUiOptions = {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  };

  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);
}
