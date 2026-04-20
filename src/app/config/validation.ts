import { z } from 'zod';

const normalizeString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
};

const normalizeOptionalString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue === '' ? undefined : normalizedValue;
};

const normalizeNumber = (value: unknown): unknown => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  if (normalizedValue === '') {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : value;
};

const normalizeBoolean = (value: unknown): unknown => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return value;
};

const requiredStringSchema = z.preprocess(normalizeString, z.string().min(1));
const optionalStringSchema = z.preprocess(normalizeOptionalString, z.string().min(1).optional());
const booleanSchema = z.preprocess(normalizeBoolean, z.boolean());
const positiveIntegerSchema = z.preprocess(normalizeNumber, z.number().int().positive());
const nonNegativeIntegerSchema = z.preprocess(normalizeNumber, z.number().int().min(0));
const portSchema = z.preprocess(normalizeNumber, z.number().int().min(1).max(65535));
const urlSchema = z.preprocess(normalizeString, z.string().url());

export const environmentSchema = z
  .object({
    APP_NAME: requiredStringSchema.default('eduzz-integrador-psp'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: requiredStringSchema.default('0.0.0.0'),
    PORT: portSchema.default(3000),
    LOG_LEVEL: requiredStringSchema.default('info'),
    DOCS_ENABLED: booleanSchema.optional(),
    DATABASE_HOST: requiredStringSchema.default('localhost'),
    DATABASE_PORT: portSchema.default(1433),
    DATABASE_NAME: requiredStringSchema.default('eduzz_integrador_psp'),
    DATABASE_USER: requiredStringSchema.default('sa'),
    DATABASE_PASSWORD: optionalStringSchema,
    DATABASE_CONNECTION_TIMEOUT_MS: positiveIntegerSchema.default(5000),
    DATABASE_POOL_MIN: nonNegativeIntegerSchema.default(1),
    DATABASE_POOL_MAX: nonNegativeIntegerSchema.default(10),
    PSP_USE_MOCK_SERVER: booleanSchema.default(true),
    PSP_TIMEOUT_MS: positiveIntegerSchema.default(10000),
    PSP_RETRY_ATTEMPTS: nonNegativeIntegerSchema.default(2),
    PAGARME_BASE_URL: urlSchema.default('http://localhost:4010/pagarme'),
    PAGARME_API_KEY: optionalStringSchema,
    MERCADOPAGO_BASE_URL: urlSchema.default('http://localhost:4020/mercadopago'),
    MERCADOPAGO_ACCESS_TOKEN: optionalStringSchema,
    SYNC_PAGE_SIZE: positiveIntegerSchema.default(20),
    SYNC_MAX_PAGE_SIZE: positiveIntegerSchema.default(100),
    SYNC_INCREMENTAL_WINDOW_MINUTES: positiveIntegerSchema.default(60),
    SYNC_SAFETY_OVERLAP_MINUTES: positiveIntegerSchema.default(5),
    SECURITY_HASH_SALT: optionalStringSchema,
    SECURITY_MASK_SENSITIVE_DATA: booleanSchema.default(true),
    SECURITY_REDACT_SECRETS_IN_LOGS: booleanSchema.default(true),
    OBS_STRUCTURED_LOGGING: booleanSchema.default(true),
    OBS_METRICS_ENABLED: booleanSchema.default(false),
    OBS_REQUEST_CORRELATION_ENABLED: booleanSchema.default(true),
    CACHE_ENABLED: booleanSchema.default(false),
    CACHE_TTL_SECONDS: positiveIntegerSchema.default(60),
    OUTBOX_DISPATCHER_ENABLED: booleanSchema.default(false),
    OUTBOX_BATCH_SIZE: positiveIntegerSchema.default(50),
    OUTBOX_POLL_INTERVAL_MS: positiveIntegerSchema.default(5000),
    OUTBOX_RETRY_LIMIT: nonNegativeIntegerSchema.default(3),
  })
  .superRefine((environment, context) => {
    if (environment.DATABASE_POOL_MAX < environment.DATABASE_POOL_MIN) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_POOL_MAX must be greater than or equal to DATABASE_POOL_MIN',
        path: ['DATABASE_POOL_MAX'],
      });
    }

    if (environment.SYNC_MAX_PAGE_SIZE < environment.SYNC_PAGE_SIZE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SYNC_MAX_PAGE_SIZE must be greater than or equal to SYNC_PAGE_SIZE',
        path: ['SYNC_MAX_PAGE_SIZE'],
      });
    }
  });

export type ValidatedEnvironment = z.output<typeof environmentSchema>;

export function validateEnvironment(input: Record<string, string | undefined>): ValidatedEnvironment {
  return environmentSchema.parse(input);
}

export function formatValidationErrors(error: unknown): string {
  if (!(error instanceof z.ZodError)) {
    return error instanceof Error ? error.message : 'unknown validation error';
  }

  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
