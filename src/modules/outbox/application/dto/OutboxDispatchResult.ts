export type OutboxDispatchResultType =
  | 'processed_successfully'
  | 'retry_scheduled'
  | 'dead_lettered'
  | 'failed_terminal';

export type OutboxDispatchResult = {
  messageId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  result: OutboxDispatchResultType;
  retryCount: number;
  nextAttemptAt?: string;
  reason?: string;
};
