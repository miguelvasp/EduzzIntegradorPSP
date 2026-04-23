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
      DATABASE_NAME: 'EduzzMultiPsp',
      DATABASE_USER: 'sa',
      DATABASE_PASSWORD: 'Eduzz@12345',
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 10,
      DATABASE_ENCRYPT: false,
      DATABASE_TRUST_SERVER_CERTIFICATE: true,
      PSP_USE_MOCK_SERVER: true,
      PSP_TIMEOUT_MS: 10000,
      PSP_RETRY_ATTEMPTS: 2,
      PAGARME_BASE_URL: 'http://mock-server:3334',
      PAGARME_API_KEY: 'mock-api-key',
      MERCADOPAGO_BASE_URL: 'http://mock-server:3334',
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

    const appConfig = createConfiguration(environment);

    expect(appConfig.psp.useMockServer).toBe(true);
    expect(appConfig.psp.pagarme.baseUrl).toBe('http://mock-server:3334');
    expect(appConfig.psp.mercadopago.baseUrl).toBe('http://mock-server:3334');
    expect(appConfig.database.name).toBe('EduzzMultiPsp');
    expect(appConfig.database.encrypt).toBe(false);
    expect(appConfig.database.trustServerCertificate).toBe(true);
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
      DATABASE_NAME: 'EduzzMultiPsp',
      DATABASE_USER: 'sa',
      DATABASE_PASSWORD: 'Eduzz@12345',
      DATABASE_CONNECTION_TIMEOUT_MS: 5000,
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 10,
      DATABASE_ENCRYPT: false,
      DATABASE_TRUST_SERVER_CERTIFICATE: true,
      PSP_USE_MOCK_SERVER: false,
      PSP_TIMEOUT_MS: 10000,
      PSP_RETRY_ATTEMPTS: 2,
      PAGARME_BASE_URL: 'https://api.pagar.me',
      PAGARME_API_KEY: 'real-api-key',
      MERCADOPAGO_BASE_URL: 'https://api.mercadopago.com',
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

    const appConfig = createConfiguration(environment);

    expect(appConfig.psp.useMockServer).toBe(false);
    expect(appConfig.psp.pagarme.baseUrl).toBe('https://api.pagar.me');
    expect(appConfig.psp.mercadopago.baseUrl).toBe('https://api.mercadopago.com');
    expect(appConfig.database.name).toBe('EduzzMultiPsp');
    expect(appConfig.database.encrypt).toBe(false);
    expect(appConfig.database.trustServerCertificate).toBe(true);
  });
});
