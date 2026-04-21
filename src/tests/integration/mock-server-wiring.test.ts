import { describe, expect, it } from 'vitest';
import { createConfiguration } from '../../app/config/configuration';
import type { ValidatedEnvironment } from '../../app/config/validation';

describe('mock server wiring', () => {
  it('deve montar configuração da aplicação apontando para o mock sem branch no domínio', () => {
    const environment: ValidatedEnvironment = {
      APP_NAME: 'eduzz-integrador-psp',
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DOCS_ENABLED: true,
      DATABASE_HOST: 'db',
      DATABASE_PORT: 1433,
      DATABASE_NAME: 'eduzz_integrador_psp',
      DATABASE_USER: 'sa',
      DATABASE_PASSWORD: 'Your_strong_Password123',
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 10,
      PSP_USE_MOCK_SERVER: true,
      PSP_TIMEOUT_MS: 10000,
      PSP_RETRY_ATTEMPTS: 2,
      PAGARME_BASE_URL: 'http://mock-server:3334/core/v5',
      PAGARME_API_KEY: 'mock-api-key',
      MERCADOPAGO_BASE_URL: 'http://mock-server:3334/v1',
      MERCADOPAGO_ACCESS_TOKEN: 'mock-access-token',
      SYNC_PAGE_SIZE: 20,
      SYNC_MAX_PAGE_SIZE: 100,
      SYNC_INCREMENTAL_WINDOW_MINUTES: 60,
      SYNC_SAFETY_OVERLAP_MINUTES: 5,
      SECURITY_HASH_SALT: 'mock-salt',
      SECURITY_MASK_SENSITIVE_DATA: true,
      SECURITY_REDACT_SECRETS_IN_LOGS: true,
      OBS_STRUCTURED_LOGGING: true,
      OBS_METRICS_ENABLED: false,
      OBS_REQUEST_CORRELATION_ENABLED: true,
      CACHE_ENABLED: false,
      CACHE_TTL_SECONDS: 60,
      OUTBOX_DISPATCHER_ENABLED: false,
      OUTBOX_BATCH_SIZE: 50,
      OUTBOX_POLL_INTERVAL_MS: 5000,
      OUTBOX_RETRY_LIMIT: 3,
    };

    const config = createConfiguration(environment);

    expect(config.psp.useMockServer).toBe(true);
    expect(config.psp.pagarme.baseUrl).toBe('http://mock-server:3334/core/v5');
    expect(config.psp.mercadopago.baseUrl).toBe('http://mock-server:3334/v1');
  });

  it('deve permitir alternar para PSP real apenas por configuração', () => {
    const environment: ValidatedEnvironment = {
      APP_NAME: 'eduzz-integrador-psp',
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DOCS_ENABLED: true,
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 1433,
      DATABASE_NAME: 'eduzz_integrador_psp',
      DATABASE_USER: 'sa',
      DATABASE_PASSWORD: 'Your_strong_Password123',
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 10,
      PSP_USE_MOCK_SERVER: false,
      PSP_TIMEOUT_MS: 10000,
      PSP_RETRY_ATTEMPTS: 2,
      PAGARME_BASE_URL: 'https://api.pagar.me/core/v5',
      PAGARME_API_KEY: 'real-api-key',
      MERCADOPAGO_BASE_URL: 'https://api.mercadopago.com/v1',
      MERCADOPAGO_ACCESS_TOKEN: 'real-access-token',
      SYNC_PAGE_SIZE: 20,
      SYNC_MAX_PAGE_SIZE: 100,
      SYNC_INCREMENTAL_WINDOW_MINUTES: 60,
      SYNC_SAFETY_OVERLAP_MINUTES: 5,
      SECURITY_HASH_SALT: 'real-salt',
      SECURITY_MASK_SENSITIVE_DATA: true,
      SECURITY_REDACT_SECRETS_IN_LOGS: true,
      OBS_STRUCTURED_LOGGING: true,
      OBS_METRICS_ENABLED: false,
      OBS_REQUEST_CORRELATION_ENABLED: true,
      CACHE_ENABLED: false,
      CACHE_TTL_SECONDS: 60,
      OUTBOX_DISPATCHER_ENABLED: false,
      OUTBOX_BATCH_SIZE: 50,
      OUTBOX_POLL_INTERVAL_MS: 5000,
      OUTBOX_RETRY_LIMIT: 3,
    };

    const config = createConfiguration(environment);

    expect(config.psp.useMockServer).toBe(false);
    expect(config.psp.pagarme.baseUrl).toBe('https://api.pagar.me/core/v5');
    expect(config.psp.mercadopago.baseUrl).toBe('https://api.mercadopago.com/v1');
  });
});
