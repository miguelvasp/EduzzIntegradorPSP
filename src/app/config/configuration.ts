import type { ValidatedEnvironment } from './validation';

export type ApplicationEnvironment = ValidatedEnvironment['NODE_ENV'];

export interface AppConfiguration {
  name: string;
  env: ApplicationEnvironment;
  host: string;
  port: number;
  logLevel: string;
  docsEnabled: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  isProduction: boolean;
}

export interface DatabaseConfiguration {
  host: string;
  port: number;
  name: string;
  user: string;
  password?: string;
  connectionTimeoutMs: number;
  poolMin: number;
  poolMax: number;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface PspProviderConfiguration {
  baseUrl: string;
}

export interface PagarmeConfiguration extends PspProviderConfiguration {
  apiKey?: string;
}

export interface MercadoPagoConfiguration extends PspProviderConfiguration {
  accessToken?: string;
}

export interface PspConfiguration {
  useMockServer: boolean;
  timeoutMs: number;
  retryAttempts: number;
  pagarme: PagarmeConfiguration;
  mercadopago: MercadoPagoConfiguration;
}

export interface SyncConfiguration {
  pageSize: number;
  maxPageSize: number;
  incrementalWindowMinutes: number;
  safetyOverlapMinutes: number;
}

export interface SecurityConfiguration {
  hashSalt?: string;
  maskSensitiveData: boolean;
  redactSecretsInLogs: boolean;
}

export interface ObservabilityConfiguration {
  structuredLogging: boolean;
  metricsEnabled: boolean;
  requestCorrelationEnabled: boolean;
}

export interface CacheConfiguration {
  enabled: boolean;
  ttlSeconds: number;
}

export interface OutboxConfiguration {
  dispatcherEnabled: boolean;
  batchSize: number;
  pollIntervalMs: number;
  retryLimit: number;
}

export interface AppConfig {
  app: AppConfiguration;
  database: DatabaseConfiguration;
  psp: PspConfiguration;
  sync: SyncConfiguration;
  security: SecurityConfiguration;
  observability: ObservabilityConfiguration;
  cache: CacheConfiguration;
  outbox: OutboxConfiguration;
}

export function createConfiguration(environment: ValidatedEnvironment): AppConfig {
  const isDevelopment = environment.NODE_ENV === 'development';
  const isTest = environment.NODE_ENV === 'test';
  const isProduction = environment.NODE_ENV === 'production';

  return {
    app: {
      name: environment.APP_NAME,
      env: environment.NODE_ENV,
      host: environment.HOST,
      port: environment.PORT,
      logLevel: environment.LOG_LEVEL,
      docsEnabled: environment.DOCS_ENABLED ?? isDevelopment,
      isDevelopment,
      isTest,
      isProduction,
    },
    database: {
      host: environment.DATABASE_HOST,
      port: environment.DATABASE_PORT,
      name: environment.DATABASE_NAME,
      user: environment.DATABASE_USER,
      password: environment.DATABASE_PASSWORD,
      connectionTimeoutMs: environment.DATABASE_CONNECTION_TIMEOUT_MS,
      poolMin: environment.DATABASE_POOL_MIN,
      poolMax: environment.DATABASE_POOL_MAX,
      encrypt: environment.DATABASE_ENCRYPT,
      trustServerCertificate: environment.DATABASE_TRUST_SERVER_CERTIFICATE,
    },
    psp: {
      useMockServer: environment.PSP_USE_MOCK_SERVER,
      timeoutMs: environment.PSP_TIMEOUT_MS,
      retryAttempts: environment.PSP_RETRY_ATTEMPTS,
      pagarme: {
        baseUrl: environment.PAGARME_BASE_URL,
        apiKey: environment.PAGARME_API_KEY,
      },
      mercadopago: {
        baseUrl: environment.MERCADOPAGO_BASE_URL,
        accessToken: environment.MERCADOPAGO_ACCESS_TOKEN,
      },
    },
    sync: {
      pageSize: environment.SYNC_PAGE_SIZE,
      maxPageSize: environment.SYNC_MAX_PAGE_SIZE,
      incrementalWindowMinutes: environment.SYNC_INCREMENTAL_WINDOW_MINUTES,
      safetyOverlapMinutes: environment.SYNC_SAFETY_OVERLAP_MINUTES,
    },
    security: {
      hashSalt: environment.SECURITY_HASH_SALT,
      maskSensitiveData: environment.SECURITY_MASK_SENSITIVE_DATA,
      redactSecretsInLogs: environment.SECURITY_REDACT_SECRETS_IN_LOGS,
    },
    observability: {
      structuredLogging: environment.OBS_STRUCTURED_LOGGING,
      metricsEnabled: environment.OBS_METRICS_ENABLED,
      requestCorrelationEnabled: environment.OBS_REQUEST_CORRELATION_ENABLED,
    },
    cache: {
      enabled: environment.CACHE_ENABLED,
      ttlSeconds: environment.CACHE_TTL_SECONDS,
    },
    outbox: {
      dispatcherEnabled: environment.OUTBOX_DISPATCHER_ENABLED,
      batchSize: environment.OUTBOX_BATCH_SIZE,
      pollIntervalMs: environment.OUTBOX_POLL_INTERVAL_MS,
      retryLimit: environment.OUTBOX_RETRY_LIMIT,
    },
  };
}
