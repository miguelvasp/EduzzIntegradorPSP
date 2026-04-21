import { SecretRedactor } from '../security/SecretRedactor';
import { RequestContext, type RequestContextState } from './RequestContext';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogPayload = {
  eventType: string;
  message: string;
  module?: string;
  component?: string;
  status?: string;
  errorCode?: string;
  durationMs?: number;
  psp?: string;
  externalId?: string;
  transactionId?: number | string;
  installmentId?: number | string;
  reconciliationCaseId?: number | string;
  syncRunId?: number | string;
  context?: Record<string, unknown>;
};

export type LoggerOptions = {
  serviceName: string;
  environment: string;
  level?: LogLevel;
};

type StructuredLogEntry = {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  eventType: string;
  message: string;
  module?: string;
  component?: string;
  requestId?: string;
  correlationId?: string;
  syncRunId?: number | string;
  psp?: string;
  externalId?: string;
  transactionId?: number | string;
  installmentId?: number | string;
  reconciliationCaseId?: number | string;
  status?: string;
  errorCode?: string;
  durationMs?: number;
  context?: Record<string, unknown>;
};

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly level: LogLevel;

  public constructor(options: LoggerOptions) {
    this.serviceName = options.serviceName;
    this.environment = options.environment;
    this.level = options.level ?? 'info';
  }

  public debug(payload: LogPayload): void {
    this.write('debug', payload);
  }

  public info(payload: LogPayload): void {
    this.write('info', payload);
  }

  public warn(payload: LogPayload): void {
    this.write('warn', payload);
  }

  public error(payload: LogPayload): void {
    this.write('error', payload);
  }

  private write(level: LogLevel, payload: LogPayload): void {
    if (levelWeight[level] < levelWeight[this.level]) {
      return;
    }

    const requestContext = RequestContext.get();
    const entry: StructuredLogEntry = this.buildEntry(level, payload, requestContext);
    const sanitized = SecretRedactor.redactObject(entry);

    const serialized = JSON.stringify(sanitized);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(serialized);
        break;
      case 'warn':
        console.warn(serialized);
        break;
      case 'error':
        console.error(serialized);
        break;
    }
  }

  private buildEntry(
    level: LogLevel,
    payload: LogPayload,
    requestContext: RequestContextState,
  ): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      eventType: payload.eventType,
      message: payload.message,
      module: payload.module ?? requestContext.module,
      component: payload.component ?? requestContext.component,
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      syncRunId: payload.syncRunId ?? requestContext.syncRunId,
      psp: payload.psp ?? requestContext.psp,
      externalId: payload.externalId ?? requestContext.externalId,
      transactionId: payload.transactionId ?? requestContext.transactionId,
      installmentId: payload.installmentId ?? requestContext.installmentId,
      reconciliationCaseId: payload.reconciliationCaseId ?? requestContext.reconciliationCaseId,
      status: payload.status,
      errorCode: payload.errorCode,
      durationMs: payload.durationMs,
      context: payload.context,
    };
  }
}
