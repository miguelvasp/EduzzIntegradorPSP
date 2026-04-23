import {
  readinessNotReadyResponseSchema,
  readinessReadyResponseSchema,
} from '../docs/openapi.schemas';

export const readinessSchema = {
  tags: ['Health'],
  summary: 'Readiness check da aplicação',
  description:
    'Valida se a aplicação está pronta para operar, verificando dependências críticas como acesso ao banco.',
  response: {
    200: readinessReadyResponseSchema,
    503: readinessNotReadyResponseSchema,
  },
};
