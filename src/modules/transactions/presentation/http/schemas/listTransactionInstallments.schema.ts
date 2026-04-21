export const listTransactionInstallmentsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  },
};
