import { ValidationError } from '../../../shared/application/errors';
import { PspType } from '../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';

export type ParsedSyncCommand = {
  targetPsp?: PspType;
  all: boolean;
  verbose: boolean;
  pageLimit?: number;
  itemLimit?: number;
  dryRun: boolean;
};

export class SyncCommandParser {
  public parse(argv: string[]): ParsedSyncCommand {
    const args = argv.slice(2);

    const hasAll = args.includes('--all');
    const verbose = args.includes('--verbose');
    const dryRun = args.includes('--dry-run');

    const pspValue = this.readOption(args, '--psp');
    const pageLimitValue = this.readOption(args, '--page-limit');
    const itemLimitValue = this.readOption(args, '--item-limit');

    if (hasAll && pspValue) {
      throw new ValidationError({
        message: 'Cannot use --all together with --psp',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          optionA: '--all',
          optionB: '--psp',
        },
      });
    }

    if (!hasAll && !pspValue) {
      throw new ValidationError({
        message: 'You must provide --all or --psp',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          requiredOptions: ['--all', '--psp'],
        },
      });
    }

    const targetPsp = pspValue ? this.parsePsp(pspValue) : undefined;

    const pageLimit = pageLimitValue
      ? this.parsePositiveInteger(pageLimitValue, '--page-limit')
      : undefined;

    const itemLimit = itemLimitValue
      ? this.parsePositiveInteger(itemLimitValue, '--item-limit')
      : undefined;

    return {
      targetPsp,
      all: hasAll,
      verbose,
      pageLimit,
      itemLimit,
      dryRun,
    };
  }

  private readOption(args: string[], optionName: string): string | undefined {
    const index = args.indexOf(optionName);

    if (index === -1) {
      return undefined;
    }

    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
      throw new ValidationError({
        message: `Option ${optionName} requires a value`,
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          option: optionName,
        },
      });
    }

    return value;
  }

  private parsePsp(value: string): PspType {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'pagarme') {
      return PspType.PAGARME;
    }

    if (normalized === 'mercado_pago') {
      return PspType.MERCADO_PAGO;
    }

    throw new ValidationError({
      message: 'Unsupported PSP value',
      code: ErrorCode.VALIDATION_ERROR,
      details: {
        field: '--psp',
        value,
      },
    });
  }

  private parsePositiveInteger(value: string, field: string): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError({
        message: `Invalid value for ${field}`,
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          field,
          value,
        },
      });
    }

    return parsed;
  }
}
