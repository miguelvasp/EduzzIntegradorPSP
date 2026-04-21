import { Logger, type LogLevel } from '../../modules/shared/infrastructure/logging/Logger';
import { config } from '../config/env';

function resolveLogLevel(value: string): LogLevel {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }

  return 'info';
}

export const appLogger = new Logger({
  serviceName: config.app.name,
  environment: config.app.env,
  level: resolveLogLevel(config.app.logLevel),
});
