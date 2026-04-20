import {
    isDocumentSensitiveKey,
    isSensitiveKey,
} from '../../domain/constants/sensitiveData';
import { SecretRedactor } from './SecretRedactor';

const DOCUMENT_REDACTED = '[DOCUMENT_REDACTED]';

export class PayloadSanitizer {
    public static sanitize<T>(input: T): T {
        const sanitized = this.process(input);

        return SecretRedactor.redactObject(sanitized as T);
    }

    private static process(value: unknown, parentKey?: string): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => this.process(item, parentKey));
        }

        if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>).map(
                ([key, currentValue]) => {
                    if (isDocumentSensitiveKey(key)) {
                        return [key, this.sanitizeDocumentValue(currentValue)];
                    }

                    return [key, this.process(currentValue, key)];
                },
            );

            return Object.fromEntries(entries);
        }

        if (parentKey && isSensitiveKey(parentKey)) {
            if (isDocumentSensitiveKey(parentKey)) {
                return this.sanitizeDocumentValue(value);
            }
        }

        return value;
    }

    private static sanitizeDocumentValue(value: unknown): unknown {
        if (typeof value !== 'string') {
            return value;
        }

        return value.trim() ? DOCUMENT_REDACTED : value;
    }
}