export const runSyncSchema = {
  body: {
    type: 'object',
    properties: {
      psp: {
        type: 'string',
        enum: ['pagarme', 'mercadopago', 'mercado_pago'],
      },
      pageLimit: { type: 'integer', minimum: 1 },
      itemLimit: { type: 'integer', minimum: 1, maximum: 100 },
      dryRun: { type: 'boolean' },
      verbose: { type: 'boolean' },
    },
    additionalProperties: false,
  },
};

export const runIncrementalSyncSchema = {
  body: {
    type: 'object',
    properties: {
      psp: {
        type: 'string',
        enum: ['pagarme', 'mercadopago', 'mercado_pago'],
      },
      pageLimit: { type: 'integer', minimum: 1 },
      itemLimit: { type: 'integer', minimum: 1, maximum: 100 },
      dryRun: { type: 'boolean' },
      verbose: { type: 'boolean' },
    },
    additionalProperties: false,
  },
};
