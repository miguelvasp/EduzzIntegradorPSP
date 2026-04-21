export type InboxConsumerContext = {
  consumerName: string;
  messageId: string;
  eventType: string;
  aggregateType?: string;
  aggregateId?: string;
  correlationId?: string;
};
