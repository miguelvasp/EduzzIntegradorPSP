export const getInstallmentByIdSchema = {
  params: {
    type: 'object',
    required: ['transactionId', 'installmentId'],
    properties: {
      transactionId: { type: 'integer', minimum: 1 },
      installmentId: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
};
