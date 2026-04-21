export type InboxProcessingResultType =
  | 'processing_started'
  | 'processed_successfully'
  | 'ignored_duplicate'
  | 'failed';

export type InboxProcessingResult = {
  result: InboxProcessingResultType;
  messageId: string;
  consumerName: string;
  reason?: string;
};
