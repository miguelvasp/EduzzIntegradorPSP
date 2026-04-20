import { describe, expect, it } from 'vitest';
import { DocumentHashService } from './DocumentHashService';

describe('DocumentHashService', () => {
    it('deve gerar o mesmo hash para documentos equivalentes com e sem máscara', () => {
        const plain = '12345678901';
        const masked = '123.456.789-01';

        const plainHash = DocumentHashService.hash(plain);
        const maskedHash = DocumentHashService.hash(masked);

        expect(plainHash).toBe(maskedHash);
    });

    it('deve gerar hashes diferentes quando o salt muda', () => {
        const value = '12345678901';

        const hashA = DocumentHashService.hash(value, 'salt-a');
        const hashB = DocumentHashService.hash(value, 'salt-b');

        expect(hashA).not.toBe(hashB);
    });

    it('deve normalizar removendo caracteres não numéricos', () => {
        expect(DocumentHashService.normalize('12.345.678/0001-99')).toBe('12345678000199');
    });

    it('deve indicar presença de documento quando houver conteúdo válido', () => {
        expect(DocumentHashService.hasDocument('123.456.789-01')).toBe(true);
        expect(DocumentHashService.hasDocument('')).toBe(false);
        expect(DocumentHashService.hasDocument(null)).toBe(false);
        expect(DocumentHashService.hasDocument(undefined)).toBe(false);
    });

    it('deve falhar quando tentar gerar hash de valor vazio', () => {
        expect(() => DocumentHashService.hash('')).toThrow('Document value is required for hashing');
    });
});