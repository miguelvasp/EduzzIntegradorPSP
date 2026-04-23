import { errorResponseSchema } from '../../../../app/server/docs/openapi.schemas';

const syncResponseSchema = {
  type: 'object',
  required: [
    'syncRunId',
    'syncRunDbId',
    'correlationId',
    'status',
    'mode',
    'targetPsps',
    'startedAt',
    'finishedAt',
    'durationMs',
    'pagesProcessed',
    'itemsRead',
  ],
  properties: {
    syncRunId: { type: 'string' },
    syncRunDbId: { type: 'integer' },
    correlationId: { type: 'string' },
    status: { type: 'string' },
    mode: { type: 'string' },
    targetPsps: {
      type: 'array',
      items: { type: 'string' },
    },
    startedAt: { type: 'string', format: 'date-time' },
    finishedAt: { type: 'string', format: 'date-time' },
    durationMs: { type: 'integer' },
    pagesProcessed: { type: 'integer' },
    itemsRead: { type: 'integer' },
  },
  additionalProperties: false,
};

export const runSyncSchema = {
  tags: ['Sync'],
  summary: 'Executar sincronização padrão',
  description:
    'Executa a sincronização do PSP informado. Use dryRun=false para persistir no banco.',
  body: {
    type: 'object',
    required: ['psp'],
    properties: {
      psp: {
        type: 'string',
        enum: ['pagarme', 'mercadopago', 'mercado_pago'],
        default: 'pagarme',
      },
      pageLimit: { type: 'integer', minimum: 1, default: 1 },
      itemLimit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      dryRun: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
    additionalProperties: false,
  },
  response: {
    200: syncResponseSchema,
    400: errorResponseSchema,
    422: errorResponseSchema,
    500: errorResponseSchema,
  },
};

export const runIncrementalSyncSchema = {
  tags: ['Sync'],
  summary: 'Executar sincronização incremental',
  description:
    'Executa a sincronização incremental do PSP informado. Use dryRun=false para persistir no banco.',
  body: {
    type: 'object',
    required: ['psp'],
    properties: {
      psp: {
        type: 'string',
        enum: ['pagarme', 'mercadopago', 'mercado_pago'],
        default: 'pagarme',
      },
      pageLimit: { type: 'integer', minimum: 1, default: 1 },
      itemLimit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      dryRun: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
    additionalProperties: false,
  },
  response: {
    200: syncResponseSchema,
    400: errorResponseSchema,
    422: errorResponseSchema,
    500: errorResponseSchema,
  },
};
