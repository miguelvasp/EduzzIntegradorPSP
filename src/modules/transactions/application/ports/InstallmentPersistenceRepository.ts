import type { CanonicalInstallmentStatus, InstallmentEntity } from '../../domain/entities';

export type PersistedInstallmentRecord = {
  id: number;
  installmentNumber: number;
  status: CanonicalInstallmentStatus;
  dueDate?: Date;
  paidAt?: Date;
};

export interface InstallmentPersistenceRepository {
  replaceByTransactionId(
    transactionId: number,
    installments: InstallmentEntity[],
  ): Promise<PersistedInstallmentRecord[]>;
}
