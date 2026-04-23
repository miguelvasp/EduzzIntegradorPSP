import {
  errorResponseSchema,
  transactionPayerResponseSchema,
} from '../../../../../app/server/docs/openapi.schemas';

export const getTransactionPayerSchema = {
  tags: ['Transactions'],
  summary: 'Obter pagador da transação',
  description: 'Retorna o pagador vinculado à transação sem expor o documento em texto puro.',
  params: {
    type: 'object',
    required: ['transactionId'],
    properties: {
      transactionId: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: transactionPayerResponseSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
};
