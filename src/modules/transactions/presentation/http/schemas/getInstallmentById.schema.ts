import {
  errorResponseSchema,
  transactionInstallmentResponseSchema,
} from '../../../../../app/server/docs/openapi.schemas';

export const getInstallmentByIdSchema = {
  tags: ['Transactions'],
  summary: 'Obter detalhe da parcela por transação e parcela',
  description:
    'Retorna uma parcela específica usando o identificador da transação e o identificador da parcela.',
  params: {
    type: 'object',
    required: ['transactionId', 'installmentId'],
    properties: {
      transactionId: { type: 'integer', minimum: 1 },
      installmentId: { type: 'integer', minimum: 1 },
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
