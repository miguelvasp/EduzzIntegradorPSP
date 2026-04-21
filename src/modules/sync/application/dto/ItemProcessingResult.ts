import { PspType } from '../../../shared/domain/enums/pspType';

export type ItemProcessingStatus = 'processed_successfully' | 'rejected' | 'conflicted' | 'failed';

export type ItemErrorCategory = 'validation' | 'domain' | 'integration' | 'internal';

export type ItemProcessingResult = {
  psp: PspType;
  externalId?: string;
  syncRunId?: string;
  status: ItemProcessingStatus;
  errorCategory?: ItemErrorCategory;
  errorCode?: string;
  message?: string;
  shouldContinue: boolean;
};
