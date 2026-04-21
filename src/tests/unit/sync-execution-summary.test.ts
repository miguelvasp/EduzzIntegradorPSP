import { describe, expect, it } from 'vitest';
import { SyncExecutionSummary } from '../../modules/sync/application/dto/SyncExecutionSummary';

describe('SyncExecutionSummary', () => {
  it('deve iniciar zerado', () => {
    const summary = new SyncExecutionSummary();

    expect(summary.getSnapshot()).toEqual({
      totalRead: 0,
      totalSucceeded: 0,
      totalRejected: 0,
      totalConflicted: 0,
      totalFailed: 0,
      totalGlobalFailures: 0,
    });
  });

  it('deve acumular contadores corretamente', () => {
    const summary = new SyncExecutionSummary();

    summary.recordRead();
    summary.recordRead();
    summary.recordSuccess();
    summary.recordRejected();
    summary.recordConflicted();
    summary.recordFailed();
    summary.recordGlobalFailure();

    expect(summary.getSnapshot()).toEqual({
      totalRead: 2,
      totalSucceeded: 1,
      totalRejected: 1,
      totalConflicted: 1,
      totalFailed: 1,
      totalGlobalFailures: 1,
    });
  });
});
