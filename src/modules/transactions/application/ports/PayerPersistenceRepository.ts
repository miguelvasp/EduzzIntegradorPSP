import type { PspType } from '../../../shared/domain/enums/pspType';
import type { PayerSnapshot } from '../../domain/entities';

export interface PayerPersistenceRepository {
  upsertFromSnapshot(params: { psp: PspType; payer: PayerSnapshot }): Promise<number>;

  saveSnapshot(params: {
    transactionId: number;
    payerId: number;
    psp: PspType;
    payer: PayerSnapshot;
  }): Promise<void>;
}
