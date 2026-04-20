import { describe, expect, it } from 'vitest';
import {
    DOCUMENT_SENSITIVE_KEYS,
    PERSONAL_SENSITIVE_KEYS,
    SECRET_SENSITIVE_KEYS,
    isDocumentSensitiveKey,
    isPersonalSensitiveKey,
    isSecretSensitiveKey,
    isSensitiveKey,
    normalizeKey,
} from './sensitiveData';

describe('sensitiveData', () => {
    it('deve normalizar chave para comparação case-insensitive', () => {
        expect(normalizeKey('  Authorization  ')).toBe('authorization');
    });

    it('deve identificar chaves de documento', () => {
        expect(isDocumentSensitiveKey('document')).toBe(true);
        expect(isDocumentSensitiveKey('CPF')).toBe(true);
        expect(isDocumentSensitiveKey('cnpj')).toBe(true);
        expect(isDocumentSensitiveKey('status')).toBe(false);
    });

    it('deve identificar chaves de segredo', () => {
        expect(isSecretSensitiveKey('token')).toBe(true);
        expect(isSecretSensitiveKey('Authorization')).toBe(true);
        expect(isSecretSensitiveKey('api_key')).toBe(true);
        expect(isSecretSensitiveKey('currency')).toBe(false);
    });

    it('deve identificar chaves pessoais', () => {
        expect(isPersonalSensitiveKey('email')).toBe(true);
        expect(isPersonalSensitiveKey('EMAIL')).toBe(true);
        expect(isPersonalSensitiveKey('name')).toBe(false);
    });

    it('deve identificar qualquer chave sensível no agregado', () => {
        expect(isSensitiveKey('cpf')).toBe(true);
        expect(isSensitiveKey('authorization')).toBe(true);
        expect(isSensitiveKey('email')).toBe(true);
        expect(isSensitiveKey('amount')).toBe(false);
    });

    it('deve expor listas mínimas esperadas', () => {
        expect(DOCUMENT_SENSITIVE_KEYS.length).toBeGreaterThan(0);
        expect(SECRET_SENSITIVE_KEYS.length).toBeGreaterThan(0);
        expect(PERSONAL_SENSITIVE_KEYS.length).toBeGreaterThan(0);
    });
});