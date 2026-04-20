import 'dotenv/config';

import { createConfiguration, type AppConfig } from './configuration';
import { formatValidationErrors, validateEnvironment } from './validation';

const environmentSource: Record<string, string | undefined> = { ...process.env };

function loadConfiguration(): AppConfig {
  try {
    const validatedEnvironment = validateEnvironment(environmentSource);

    return createConfiguration(validatedEnvironment);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid environment configuration: ${formatValidationErrors(error)}`, { cause: error });
    }

    throw new Error('Invalid environment configuration', { cause: error });
  }
}

export const config = loadConfiguration();
