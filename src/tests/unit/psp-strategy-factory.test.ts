import { describe, expect, it } from 'vitest';
import type {
  PspSyncListPageResult,
  PspSyncStrategy,
} from '../../modules/psp/domain/contracts/PspSyncStrategy';
import { PspStrategyFactory } from '../../modules/psp/infrastructure/factories/PspStrategyFactory';
import { DomainError } from '../../modules/shared/application/errors';
import { PspType } from '../../modules/shared/domain/enums/pspType';
import type { TransactionEntity } from '../../modules/transactions/domain/entities';

class FakePagarmeStrategy implements PspSyncStrategy<{ id: string }> {
  public getPsp(): PspType {
    return PspType.PAGARME;
  }

  public async listPage(): Promise<PspSyncListPageResult<{ id: string }>> {
    return {
      items: [],
      pagination: {},
    };
  }

  public async getById(externalId: string): Promise<{ id: string }> {
    return { id: externalId };
  }

  public adapt(): TransactionEntity {
    return {} as TransactionEntity;
  }
}

class FakeMercadoPagoStrategy implements PspSyncStrategy<{ id: string }> {
  public getPsp(): PspType {
    return PspType.MERCADO_PAGO;
  }

  public async listPage(): Promise<PspSyncListPageResult<{ id: string }>> {
    return {
      items: [],
      pagination: {},
    };
  }

  public async getById(externalId: string): Promise<{ id: string }> {
    return { id: externalId };
  }

  public adapt(): TransactionEntity {
    return {} as TransactionEntity;
  }
}

describe('PspStrategyFactory', () => {
  it('deve resolver strategy do Pagar.me', () => {
    const pagarmeStrategy = new FakePagarmeStrategy();
    const mercadopagoStrategy = new FakeMercadoPagoStrategy();

    const factory = new PspStrategyFactory([pagarmeStrategy, mercadopagoStrategy]);

    const resolved = factory.resolve(PspType.PAGARME);

    expect(resolved).toBe(pagarmeStrategy);
  });

  it('deve resolver strategy do Mercado Pago', () => {
    const pagarmeStrategy = new FakePagarmeStrategy();
    const mercadopagoStrategy = new FakeMercadoPagoStrategy();

    const factory = new PspStrategyFactory([pagarmeStrategy, mercadopagoStrategy]);

    const resolved = factory.resolve(PspType.MERCADO_PAGO);

    expect(resolved).toBe(mercadopagoStrategy);
  });

  it('deve falhar para PSP não suportado', () => {
    const factory = new PspStrategyFactory([]);

    expect(() => factory.resolve(PspType.PAGARME)).toThrow(DomainError);
  });
});
