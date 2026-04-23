import {
  errorResponseSchema,
  transactionInstallmentResponseSchema,
} from '../../../../../app/server/docs/openapi.schemas';

export const getInstallmentByStandaloneIdSchema = {
  tags: ['Transactions'],
  summary: 'Obter detalhe da parcela',
  description: 'Retorna uma parcela específica pelo identificador único da parcela.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: transactionInstallmentResponseSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
};
