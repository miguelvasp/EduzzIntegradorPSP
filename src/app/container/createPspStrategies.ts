import { MercadoPagoHttpClient } from '../../modules/psp/infrastructure/clients/mercadopago/MercadoPagoHttpClient';
import { MercadoPagoTransactionAdapter } from '../../modules/psp/infrastructure/clients/mercadopago/MercadoPagoTransactionAdapter';
import { PagarmeHttpClient } from '../../modules/psp/infrastructure/clients/pagarme/PagarmeHttpClient';
import { PagarmeTransactionAdapter } from '../../modules/psp/infrastructure/clients/pagarme/PagarmeTransactionAdapter';
import { MercadoPagoSyncStrategy } from '../../modules/psp/infrastructure/strategies/MercadoPagoSyncStrategy';
import { PagarmeSyncStrategy } from '../../modules/psp/infrastructure/strategies/PagarmeSyncStrategy';

export function createPspStrategies() {
  const pagarmeStrategy = new PagarmeSyncStrategy(
    new PagarmeHttpClient({
      baseUrl: process.env.PAGARME_BASE_URL ?? '',
      apiKey: process.env.PAGARME_API_KEY ?? '',
      timeoutMs: Number(process.env.PAGARME_TIMEOUT_MS ?? process.env.PSP_TIMEOUT_MS ?? 5000),
      retry: {
        maxAttempts: Number(
          process.env.PAGARME_RETRY_MAX_ATTEMPTS ?? process.env.PSP_RETRY_ATTEMPTS ?? 2,
        ),
        baseDelayMs: Number(process.env.PAGARME_RETRY_BASE_DELAY_MS ?? 100),
        maxDelayMs: Number(process.env.PAGARME_RETRY_MAX_DELAY_MS ?? 1000),
        backoffFactor: Number(process.env.PAGARME_RETRY_BACKOFF_FACTOR ?? 2),
        jitterFactor: Number(process.env.PAGARME_RETRY_JITTER_FACTOR ?? 0),
      },
      circuitBreaker: {
        failureThreshold: Number(process.env.PAGARME_CB_FAILURE_THRESHOLD ?? 2),
        recoveryTimeoutMs: Number(process.env.PAGARME_CB_RECOVERY_TIMEOUT_MS ?? 1000),
      },
    }),
    new PagarmeTransactionAdapter(),
  );

  const mercadoPagoBaseUrl =
    process.env.MERCADOPAGO_BASE_URL ?? process.env.MERCADO_PAGO_BASE_URL ?? '';
  const mercadoPagoAccessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '';

  const mercadoPagoStrategy = new MercadoPagoSyncStrategy(
    new MercadoPagoHttpClient({
      baseUrl: mercadoPagoBaseUrl,
      accessToken: mercadoPagoAccessToken,
      timeoutMs: Number(
        process.env.MERCADOPAGO_TIMEOUT_MS ??
          process.env.MERCADO_PAGO_TIMEOUT_MS ??
          process.env.PSP_TIMEOUT_MS ??
          5000,
      ),
      retry: {
        maxAttempts: Number(
          process.env.MERCADOPAGO_RETRY_MAX_ATTEMPTS ??
            process.env.MERCADO_PAGO_RETRY_MAX_ATTEMPTS ??
            process.env.PSP_RETRY_ATTEMPTS ??
            2,
        ),
        baseDelayMs: Number(
          process.env.MERCADOPAGO_RETRY_BASE_DELAY_MS ??
            process.env.MERCADO_PAGO_RETRY_BASE_DELAY_MS ??
            100,
        ),
        maxDelayMs: Number(
          process.env.MERCADOPAGO_RETRY_MAX_DELAY_MS ??
            process.env.MERCADO_PAGO_RETRY_MAX_DELAY_MS ??
            1000,
        ),
        backoffFactor: Number(
          process.env.MERCADOPAGO_RETRY_BACKOFF_FACTOR ??
            process.env.MERCADO_PAGO_RETRY_BACKOFF_FACTOR ??
            2,
        ),
        jitterFactor: Number(
          process.env.MERCADOPAGO_RETRY_JITTER_FACTOR ??
            process.env.MERCADO_PAGO_RETRY_JITTER_FACTOR ??
            0,
        ),
      },
      circuitBreaker: {
        failureThreshold: Number(
          process.env.MERCADOPAGO_CB_FAILURE_THRESHOLD ??
            process.env.MERCADO_PAGO_CB_FAILURE_THRESHOLD ??
            2,
        ),
        recoveryTimeoutMs: Number(
          process.env.MERCADOPAGO_CB_RECOVERY_TIMEOUT_MS ??
            process.env.MERCADO_PAGO_CB_RECOVERY_TIMEOUT_MS ??
            1000,
        ),
      },
    }),
    new MercadoPagoTransactionAdapter(),
  );

  return [pagarmeStrategy, mercadoPagoStrategy];
}
