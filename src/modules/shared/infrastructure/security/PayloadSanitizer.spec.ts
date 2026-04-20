import { describe, expect, it } from 'vitest';
import { PayloadSanitizer } from './PayloadSanitizer';

describe('PayloadSanitizer', () => {
    it('deve sanitizar documento em objeto simples', () => {
        const input = {
            document: '123.456.789-01',
            safe: 'ok',
        };

        const result = PayloadSanitizer.sanitize(input);

        expect(result).toEqual({
            document: '[DOCUMENT_REDACTED]',
            safe: 'ok',
        });
    });

    it('deve sanitizar documento em estrutura aninhada', () => {
        const input = {
            customer: {
                document: '12345678901',
                document_type: 'CPF',
                name: 'Maria',
            },
        };

        const result = PayloadSanitizer.sanitize(input);

        expect(result).toEqual({
            customer: {
                document: '[DOCUMENT_REDACTED]',
                document_type: 'CPF',
                name: 'Maria',
            },
        });
    });

    it('deve sanitizar documentos e redigir segredos e email no mesmo payload', () => {
        const input = {
            payer: {
                email: 'user@example.com',
                document: '12345678901',
            },
            headers: {
                authorization: 'Bearer abc',
                api_key: 'secret',
            },
        };

        const result = PayloadSanitizer.sanitize(input);

        expect(result).toEqual({
            payer: {
                email: '[MASKED_EMAIL]',
                document: '[DOCUMENT_REDACTED]',
            },
            headers: {
                authorization: '[REDACTED]',
                api_key: '[REDACTED]',
            },
        });
    });

    it('deve sanitizar arrays de objetos', () => {
        const input = {
            items: [
                { cpf: '12345678901' },
                { cnpj: '12345678000199' },
                { email: 'a@a.com' },
            ],
        };

        const result = PayloadSanitizer.sanitize(input);

        expect(result).toEqual({
            items: [
                { cpf: '[DOCUMENT_REDACTED]' },
                { cnpj: '[DOCUMENT_REDACTED]' },
                { email: '[MASKED_EMAIL]' },
            ],
        });
    });

    it('deve preservar campos não sensíveis', () => {
        const input = {
            id: 'or_123',
            status: 'paid',
            amount: 10000,
            nested: {
                currency: 'BRL',
            },
        };

        const result = PayloadSanitizer.sanitize(input);

        expect(result).toEqual(input);
    });
});