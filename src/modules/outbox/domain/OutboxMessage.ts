export type OutboxStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'retry_scheduled'
  | 'dead_lettered'
  | 'failed_terminal';

export type OutboxMessage = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  createdAt: string;
  availableAt: string;
  correlationId?: string;
  syncRunId?: string;
  retryCount: number;
  lastError?: string;
};
