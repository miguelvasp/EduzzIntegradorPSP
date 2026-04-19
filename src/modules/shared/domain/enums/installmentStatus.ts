export const InstallmentStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PAID: 'paid',
  CANCELED: 'canceled',
  FAILED: 'failed',
  UNKNOWN: 'unknown',
} as const;

export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus];
