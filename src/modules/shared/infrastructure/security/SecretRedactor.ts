import {
  isPersonalSensitiveKey,
  isSecretSensitiveKey,
} from '../../domain/constants/sensitiveData';

const REDACTED = '[REDACTED]';
const MASKED_EMAIL = '[MASKED_EMAIL]';

export class SecretRedactor {
  public static redactValue(key: string, value: unknown): unknown {
    if (isSecretSensitiveKey(key)) {
      return REDACTED;
    }

    if (isPersonalSensitiveKey(key)) {
      return typeof value === 'string' && value.trim() ? MASKED_EMAIL : value;
    }

    return value;
  }

  public static redactObject<T>(input: T): T {
    return this.process(input) as T;
  }

  private static process(value: unknown, parentKey?: string): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.process(item, parentKey));
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).map(
        ([key, currentValue]) => {
          if (isSecretSensitiveKey(key) || isPersonalSensitiveKey(key)) {
            return [key, this.redactValue(key, currentValue)];
          }

          return [key, this.process(currentValue, key)];
        },
      );

      return Object.fromEntries(entries);
    }

    if (parentKey && (isSecretSensitiveKey(parentKey) || isPersonalSensitiveKey(parentKey))) {
      return this.redactValue(parentKey, value);
    }

    return value;
  }
}