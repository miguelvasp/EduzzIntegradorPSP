import {
  errorResponseSchema,
  transactionInstallmentsResponseSchema,
} from '../../../../../app/server/docs/openapi.schemas';

export const listTransactionInstallmentsSchema = {
  tags: ['Transactions'],
  summary: 'Listar parcelas da transação',
  description: 'Retorna as parcelas da transação ordenadas por número da parcela.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: transactionInstallmentsResponseSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
};
