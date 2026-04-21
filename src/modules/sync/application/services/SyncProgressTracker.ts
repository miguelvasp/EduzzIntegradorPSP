import { PspType } from '../../../shared/domain/enums/pspType';

export type SyncProgressSnapshot = {
  currentPsp?: PspType;
  pagesProcessed: number;
  itemsRead: number;
  itemsProcessed: number;
  itemsFailed: number;
};

export class SyncProgressTracker {
  private currentPsp?: PspType;
  private pagesProcessed = 0;
  private itemsRead = 0;
  private itemsProcessed = 0;
  private itemsFailed = 0;

  public startPsp(psp: PspType): void {
    this.currentPsp = psp;
  }

  public recordPageProcessed(): void {
    this.pagesProcessed += 1;
  }

  public recordItemRead(): void {
    this.itemsRead += 1;
  }

  public recordItemProcessed(): void {
    this.itemsProcessed += 1;
  }

  public recordItemFailed(): void {
    this.itemsFailed += 1;
  }

  public getSnapshot(): SyncProgressSnapshot {
    return {
      currentPsp: this.currentPsp,
      pagesProcessed: this.pagesProcessed,
      itemsRead: this.itemsRead,
      itemsProcessed: this.itemsProcessed,
      itemsFailed: this.itemsFailed,
    };
  }
}
