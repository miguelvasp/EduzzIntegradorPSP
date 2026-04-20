const DOCUMENT_SENSITIVE_KEYS = [
    'document',
    'document_number',
    'cpf',
    'cnpj',
    'tax_id',
] as const;

const SECRET_SENSITIVE_KEYS = [
    'authorization',
    'token',
    'access_token',
    'api_key',
    'apikey',
    'secret',
    'client_secret',
    'password',
    'connection_string',
] as const;

const PERSONAL_SENSITIVE_KEYS = [
    'email',
] as const;

function normalizeKey(key: string): string {
    return key.trim().toLowerCase();
}

export function isDocumentSensitiveKey(key: string): boolean {
    return DOCUMENT_SENSITIVE_KEYS.includes(
        normalizeKey(key) as (typeof DOCUMENT_SENSITIVE_KEYS)[number],
    );
}

export function isSecretSensitiveKey(key: string): boolean {
    return SECRET_SENSITIVE_KEYS.includes(
        normalizeKey(key) as (typeof SECRET_SENSITIVE_KEYS)[number],
    );
}

export function isPersonalSensitiveKey(key: string): boolean {
    return PERSONAL_SENSITIVE_KEYS.includes(
        normalizeKey(key) as (typeof PERSONAL_SENSITIVE_KEYS)[number],
    );
}

export function isSensitiveKey(key: string): boolean {
    return (
        isDocumentSensitiveKey(key) ||
        isSecretSensitiveKey(key) ||
        isPersonalSensitiveKey(key)
    );
}

export {
    DOCUMENT_SENSITIVE_KEYS,
    SECRET_SENSITIVE_KEYS,
    PERSONAL_SENSITIVE_KEYS,
    normalizeKey,
};