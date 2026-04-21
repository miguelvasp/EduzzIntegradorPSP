export const getTransactionPayerSchema = {
  params: {
    type: 'object',
    required: ['transactionId'],
    properties: {
      transactionId: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
};
