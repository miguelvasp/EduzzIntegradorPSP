export const EventType = {
  SYNC_STARTED: 'sync.started',
  SYNC_FINISHED: 'sync.finished',
  SYNC_FAILED: 'sync.failed',
  TRANSACTION_RECEIVED: 'transaction.received',
  TRANSACTION_UPDATED: 'transaction.updated',
  TRANSACTION_REJECTED: 'transaction.rejected',
  RECONCILIATION_CONFLICT_DETECTED: 'reconciliation.conflict_detected',
  RISK_SIGNAL_DETECTED: 'risk.signal_detected',
  OUTBOX_EVENT_CREATED: 'outbox.event_created',
  APPLICATION_ERROR: 'application.error',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];
