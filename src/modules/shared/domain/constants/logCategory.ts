export const LogCategory = {
  APPLICATION: 'application',
  HTTP: 'http',
  SYNC: 'sync',
  PSP: 'psp',
  RECONCILIATION: 'reconciliation',
  RISK: 'risk',
  OUTBOX: 'outbox',
  SECURITY: 'security',
} as const;

export type LogCategory = (typeof LogCategory)[keyof typeof LogCategory];
