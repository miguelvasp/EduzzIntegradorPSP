import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from './Logger';
import { RequestContext } from './RequestContext';

describe('Logger', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should emit structured info log with context', () => {
    const logger = new Logger({
      serviceName: 'eduzz-integrador',
      environment: 'test',
      level: 'info',
    });

    RequestContext.run(
      RequestContext.createBaseContext({
        requestId: 'req-1',
        correlationId: 'corr-1',
        module: 'http',
        component: 'request',
      }),
      () => {
        logger.info({
          eventType: 'http_request',
          message: 'HTTP request started',
          status: 'started',
          context: {
            method: 'GET',
            authorization: 'Bearer secret',
          },
        });
      },
    );

    expect(logSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);

    expect(payload).toMatchObject({
      level: 'info',
      service: 'eduzz-integrador',
      environment: 'test',
      eventType: 'http_request',
      message: 'HTTP request started',
      requestId: 'req-1',
      correlationId: 'corr-1',
      module: 'http',
      component: 'request',
      status: 'started',
    });

    expect(payload.context.authorization).toBe('[REDACTED]');
  });

  it('should emit warn log to console.warn', () => {
    const logger = new Logger({
      serviceName: 'eduzz-integrador',
      environment: 'test',
      level: 'debug',
    });

    logger.warn({
      eventType: 'security_event',
      message: 'Sensitive data redacted',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit error log to console.error', () => {
    const logger = new Logger({
      serviceName: 'eduzz-integrador',
      environment: 'test',
      level: 'debug',
    });

    logger.error({
      eventType: 'processing_error',
      message: 'Item processing failed',
      errorCode: 'ERR_PROCESSING',
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should respect minimum configured level', () => {
    const logger = new Logger({
      serviceName: 'eduzz-integrador',
      environment: 'test',
      level: 'warn',
    });

    logger.info({
      eventType: 'http_request',
      message: 'should not be logged',
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
