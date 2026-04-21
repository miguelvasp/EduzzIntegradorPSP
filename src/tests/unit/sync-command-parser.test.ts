import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../modules/shared/application/errors';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import { SyncCommandParser } from '../../modules/sync/application/services/SyncCommandParser';

describe('SyncCommandParser', () => {
  it('deve fazer parse de --all', () => {
    const parser = new SyncCommandParser();

    const result = parser.parse(['node', 'sync.cli.js', '--all']);

    expect(result).toEqual({
      targetPsp: undefined,
      all: true,
      verbose: false,
      pageLimit: undefined,
      itemLimit: undefined,
      dryRun: false,
    });
  });

  it('deve fazer parse de --psp pagarme', () => {
    const parser = new SyncCommandParser();

    const result = parser.parse(['node', 'sync.cli.js', '--psp', 'pagarme']);

    expect(result.targetPsp).toBe(PspType.PAGARME);
    expect(result.all).toBe(false);
  });

  it('deve fazer parse de --psp mercado_pago', () => {
    const parser = new SyncCommandParser();

    const result = parser.parse(['node', 'sync.cli.js', '--psp', 'mercado_pago']);

    expect(result.targetPsp).toBe(PspType.MERCADO_PAGO);
    expect(result.all).toBe(false);
  });

  it('deve fazer parse de flags opcionais', () => {
    const parser = new SyncCommandParser();

    const result = parser.parse([
      'node',
      'sync.cli.js',
      '--all',
      '--verbose',
      '--dry-run',
      '--page-limit',
      '2',
      '--item-limit',
      '10',
    ]);

    expect(result).toEqual({
      targetPsp: undefined,
      all: true,
      verbose: true,
      pageLimit: 2,
      itemLimit: 10,
      dryRun: true,
    });
  });

  it('deve falhar para PSP inválido', () => {
    const parser = new SyncCommandParser();

    expect(() => parser.parse(['node', 'sync.cli.js', '--psp', 'abc'])).toThrow(ValidationError);
  });

  it('deve falhar para --all junto com --psp', () => {
    const parser = new SyncCommandParser();

    expect(() => parser.parse(['node', 'sync.cli.js', '--all', '--psp', 'pagarme'])).toThrow(
      ValidationError,
    );
  });

  it('deve falhar sem --all e sem --psp', () => {
    const parser = new SyncCommandParser();

    expect(() => parser.parse(['node', 'sync.cli.js'])).toThrow(ValidationError);
  });

  it('deve falhar quando --page-limit for inválido', () => {
    const parser = new SyncCommandParser();

    expect(() => parser.parse(['node', 'sync.cli.js', '--all', '--page-limit', '0'])).toThrow(
      ValidationError,
    );
  });

  it('deve falhar quando --item-limit for inválido', () => {
    const parser = new SyncCommandParser();

    expect(() => parser.parse(['node', 'sync.cli.js', '--all', '--item-limit', '-1'])).toThrow(
      ValidationError,
    );
  });
});
