import type { PspType } from '../../../shared/domain/enums/pspType';

export type SyncCheckpoint = {
  psp: PspType;
  checkpointValue: string;
  lastSyncAt?: Date;
  page?: number;
  offset?: number;
  cursor?: string;
  updatedAt: Date;
};

export interface SyncCheckpointRepository {
  getByPsp(psp: PspType): Promise<SyncCheckpoint | null>;
  save(checkpoint: SyncCheckpoint): Promise<void>;
}
