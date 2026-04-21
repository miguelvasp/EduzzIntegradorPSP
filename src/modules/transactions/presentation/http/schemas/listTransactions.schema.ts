export const listTransactionsSchema = {
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      status: { type: 'string' },
      psp: { type: 'string' },
      payerDocument: { type: 'string' },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    additionalProperties: false,
  },
};
