import { describe, expect, it } from 'vitest';
import { SecretRedactor } from './SecretRedactor';

describe('SecretRedactor', () => {
    it('deve redigir segredos em objeto simples', () => {
        const input = {
            token: 'abc123',
            api_key: 'secret-key',
            password: '123456',
            safe: 'ok',
        };

        const result = SecretRedactor.redactObject(input);

        expect(result).toEqual({
            token: '[REDACTED]',
            api_key: '[REDACTED]',
            password: '[REDACTED]',
            safe: 'ok',
        });
    });

    it('deve mascarar email', () => {
        const input = {
            email: 'user@example.com',
            safe: 'ok',
        };

        const result = SecretRedactor.redactObject(input);

        expect(result).toEqual({
            email: '[MASKED_EMAIL]',
            safe: 'ok',
        });
    });

    it('deve redigir recursivamente objetos aninhados', () => {
        const input = {
            auth: {
                authorization: 'Bearer token-123',
            },
            nested: {
                email: 'john@example.com',
                apiKey: 'abc',
            },
        };

        const result = SecretRedactor.redactObject(input);

        expect(result).toEqual({
            auth: {
                authorization: '[REDACTED]',
            },
            nested: {
                email: '[MASKED_EMAIL]',
                apiKey: '[REDACTED]',
            },
        });
    });

    it('deve redigir itens em arrays de objetos', () => {
        const input = {
            items: [
                { token: 'a' },
                { email: 'a@a.com' },
                { safe: 'value' },
            ],
        };

        const result = SecretRedactor.redactObject(input);

        expect(result).toEqual({
            items: [
                { token: '[REDACTED]' },
                { email: '[MASKED_EMAIL]' },
                { safe: 'value' },
            ],
        });
    });

    it('deve manter valores não sensíveis inalterados', () => {
        const input = {
            status: 'paid',
            amount: 1000,
            nested: {
                currency: 'BRL',
            },
        };

        const result = SecretRedactor.redactObject(input);

        expect(result).toEqual(input);
    });
});