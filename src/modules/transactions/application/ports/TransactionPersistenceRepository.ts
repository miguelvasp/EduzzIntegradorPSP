import type { PspType } from '../../../shared/domain/enums/pspType';
import type { TransactionEntity } from '../../domain/entities';

export interface TransactionPersistenceRepository {
  findByExternalReference(psp: PspType, externalId: string): Promise<TransactionEntity | null>;
  insert(params: {
    transaction: TransactionEntity;
    payerId: number;
    lastSyncedAt: Date;
  }): Promise<number>;
  update(params: {
    transactionId: number;
    transaction: TransactionEntity;
    payerId: number;
    lastSyncedAt: Date;
  }): Promise<void>;
}
