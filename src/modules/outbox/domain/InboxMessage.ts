export type InboxStatus = 'received' | 'processing' | 'processed' | 'failed' | 'ignored_duplicate';

export type InboxMessage = {
  id: string;
  messageId: string;
  eventType: string;
  consumerName: string;
  aggregateType?: string;
  aggregateId?: string;
  status: InboxStatus;
  receivedAt: string;
  processedAt?: string;
  correlationId?: string;
  lastError?: string;
};
