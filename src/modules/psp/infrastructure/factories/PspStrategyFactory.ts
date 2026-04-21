import { DomainError } from '../../../shared/application/errors';
import { PspType } from '../../../shared/domain/enums/pspType';
import { ErrorCode } from '../../../shared/domain/error-codes/errorCode';
import type { PspSyncStrategy } from '../../domain/contracts/PspSyncStrategy';

export class PspStrategyFactory {
  private readonly strategies = new Map<PspType, PspSyncStrategy<unknown>>();

  public constructor(strategies: Array<PspSyncStrategy<unknown>>) {
    for (const strategy of strategies) {
      this.strategies.set(strategy.getPsp(), strategy);
    }
  }

  public resolve<TExternalItem>(psp: PspType): PspSyncStrategy<TExternalItem> {
    const strategy = this.strategies.get(psp);

    if (!strategy) {
      throw new DomainError({
        message: 'PSP strategy not supported',
        code: ErrorCode.DOMAIN_ERROR,
        details: {
          psp,
        },
      });
    }

    return strategy as PspSyncStrategy<TExternalItem>;
  }
}
