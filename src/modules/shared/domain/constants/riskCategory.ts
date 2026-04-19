export const RiskCategory = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  DATA_INCONSISTENCY: 'data_inconsistency',
  SUSPICIOUS_RETRY_PATTERN: 'suspicious_retry_pattern',
} as const;

export type RiskCategory = (typeof RiskCategory)[keyof typeof RiskCategory];
