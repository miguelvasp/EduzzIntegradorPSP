import {
  errorResponseSchema,
  paginatedTransactionsResponseSchema,
} from '../../../../../app/server/docs/openapi.schemas';

export const listTransactionsSchema = {
  tags: ['Transactions'],
  summary: 'Listar transações',
  description:
    'Lista transações paginadas com filtros opcionais por data, status, PSP e hash do documento do pagador.',
  querystring: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
      },
      endDate: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
      psp: {
        type: 'string',
      },
      payerDocument: {
        type: 'string',
      },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    additionalProperties: false,
  },
  response: {
    200: paginatedTransactionsResponseSchema,
    400: errorResponseSchema,
    500: errorResponseSchema,
  },
};
