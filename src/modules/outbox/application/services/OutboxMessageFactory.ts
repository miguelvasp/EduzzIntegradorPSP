import { randomUUID } from 'node:crypto';
import type { OutboxMessage } from '../../domain/OutboxMessage';

export type SupportedOutboxEventType =
  | 'transaction.ingested'
  | 'transaction.updated'
  | 'transaction.rejected'
  | 'transaction.conflict_detected'
  | 'reconciliation.case_opened'
  | 'sync.finished'
  | 'sync.failed';

export class OutboxMessageFactory {
  public create(params: {
    eventType: SupportedOutboxEventType;
    aggregateType: string;
    aggregateId: string | number;
    payload: Record<string, unknown>;
    correlationId?: string;
    syncRunId?: string;
  }): OutboxMessage {
    const now = new Date().toISOString();
    const sanitizedPayload = this.sanitizePayload(params.payload);

    return {
      id: randomUUID(),
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: String(params.aggregateId),
      payload: sanitizedPayload,
      status: 'pending',
      createdAt: now,
      availableAt: now,
      correlationId: params.correlationId,
      syncRunId: params.syncRunId,
      retryCount: 0,
    };
  }

  private sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const entries = Object.entries(payload).filter(([key]) => {
      const normalizedKey = key.toLowerCase();

      if (normalizedKey.includes('document')) {
        return false;
      }

      if (normalizedKey.includes('hash')) {
        return false;
      }

      if (normalizedKey.includes('rawpayload')) {
        return false;
      }

      if (normalizedKey.includes('secret')) {
        return false;
      }

      return true;
    });

    return Object.fromEntries(entries);
  }
}
