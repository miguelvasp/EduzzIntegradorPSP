export const healthResponseSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      example: 'ok',
    },
  },
  additionalProperties: false,
};

export const errorResponseSchema = {
  type: 'object',
  required: ['status', 'error', 'code', 'message', 'path', 'requestId', 'timestamp'],
  properties: {
    status: {
      type: 'integer',
      example: 404,
    },
    error: {
      type: 'string',
      example: 'Not Found',
    },
    code: {
      type: 'string',
      example: 'resource_not_found',
    },
    message: {
      type: 'string',
      example: 'Resource not found',
    },
    path: {
      type: 'string',
      example: '/transactions/999',
    },
    requestId: {
      type: 'string',
      example: 'req-123',
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-23T12:00:00.000Z',
    },
    details: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: false,
};

export const transactionListItemResponseSchema = {
  type: 'object',
  required: [
    'id',
    'externalId',
    'psp',
    'status',
    'originalAmount',
    'netAmount',
    'fees',
    'installmentCount',
    'currency',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', example: '4' },
    externalId: { type: 'string', example: 'or_pag_002' },
    psp: { type: 'string', example: 'pagarme' },
    status: { type: 'string', example: 'paid' },
    originalAmount: { type: 'string', example: '20000' },
    netAmount: { type: 'string', example: '20000' },
    fees: { type: 'string', example: '0' },
    installmentCount: { type: 'integer', example: 1 },
    currency: { type: 'string', example: 'BRL' },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-22T09:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-22T10:00:00.000Z',
    },
  },
  additionalProperties: false,
};

export const paginatedTransactionsResponseSchema = {
  type: 'object',
  required: ['items', 'total', 'page', 'limit', 'totalPages'],
  properties: {
    items: {
      type: 'array',
      items: transactionListItemResponseSchema,
    },
    total: { type: 'integer', example: 4 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 1 },
  },
  additionalProperties: false,
};

export const transactionPayerResponseSchema = {
  type: 'object',
  required: ['name', 'email', 'hasDocument'],
  properties: {
    id: { type: 'string', example: '1' },
    externalId: { type: 'string', example: 'mp_payer_001' },
    name: { type: 'string', example: 'Ana Lima' },
    email: { type: 'string', example: 'ana@example.com' },
    documentType: { type: 'string', example: 'cpf' },
    hasDocument: { type: 'boolean', example: true },
  },
  additionalProperties: false,
};

export const transactionInstallmentSummaryResponseSchema = {
  type: 'object',
  required: ['id', 'installmentNumber', 'amount', 'fees', 'status'],
  properties: {
    id: { type: 'string', example: '1' },
    installmentNumber: { type: 'integer', example: 1 },
    amount: { type: 'string', example: '5017' },
    fees: { type: 'string', example: '184' },
    status: { type: 'string', example: 'paid' },
    paidAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-23T11:47:46.586Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-23T11:47:46.586Z',
    },
  },
  additionalProperties: false,
};

export const transactionInstallmentResponseSchema = {
  type: 'object',
  required: ['id', 'transactionId', 'installmentNumber', 'amount', 'fees', 'status'],
  properties: {
    id: { type: 'string', example: '1' },
    transactionId: { type: 'string', example: '1' },
    installmentNumber: { type: 'integer', example: 1 },
    amount: { type: 'string', example: '5017' },
    fees: { type: 'string', example: '184' },
    status: { type: 'string', example: 'paid' },
    dueAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-20T00:00:00.000Z',
    },
    paidAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-23T11:47:46.586Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-23T11:47:46.586Z',
    },
  },
  additionalProperties: false,
};

export const transactionInstallmentsResponseSchema = {
  type: 'array',
  items: transactionInstallmentResponseSchema,
};

export const transactionDetailResponseSchema = {
  type: 'object',
  required: [
    'id',
    'externalId',
    'psp',
    'status',
    'originalAmount',
    'netAmount',
    'fees',
    'installmentCount',
    'currency',
    'createdAt',
    'updatedAt',
    'installments',
  ],
  properties: {
    id: { type: 'string', example: '1' },
    externalId: { type: 'string', example: '1001' },
    psp: { type: 'string', example: 'mercadopago' },
    status: { type: 'string', example: 'paid' },
    originalAmount: { type: 'string', example: '15050' },
    netAmount: { type: 'string', example: '14500' },
    fees: { type: 'string', example: '550' },
    installmentCount: { type: 'integer', example: 3 },
    currency: { type: 'string', example: 'BRL' },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-21T09:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-21T10:00:00.000Z',
    },
    payer: transactionPayerResponseSchema,
    installments: {
      type: 'array',
      items: transactionInstallmentSummaryResponseSchema,
    },
  },
  additionalProperties: false,
};

export const openApiTags = [
  { name: 'Health', description: 'Verificação básica da aplicação' },
  { name: 'Transactions', description: 'Consulta de transações, parcelas e pagador' },
];

export const openApiComponentSchemas = {
  HealthResponse: healthResponseSchema,
  ErrorResponse: errorResponseSchema,
  TransactionListItemResponse: transactionListItemResponseSchema,
  PaginatedTransactionsResponse: paginatedTransactionsResponseSchema,
  TransactionPayerResponse: transactionPayerResponseSchema,
  TransactionInstallmentSummaryResponse: transactionInstallmentSummaryResponseSchema,
  TransactionInstallmentResponse: transactionInstallmentResponseSchema,
  TransactionInstallmentsResponse: transactionInstallmentsResponseSchema,
  TransactionDetailResponse: transactionDetailResponseSchema,
};
