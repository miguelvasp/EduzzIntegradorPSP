import { describe, expect, it } from 'vitest';
import { ReconciliationEngine } from '../../modules/reconciliation/application/services/ReconciliationEngine';
import { ReconciliationSeverityClassifier } from '../../modules/reconciliation/application/services/ReconciliationSeverityClassifier';

describe('ReconciliationEngine', () => {
  function createEngine() {
    return new ReconciliationEngine(new ReconciliationSeverityClassifier());
  }

  it('deve abrir caso para divergência financeira sob revisão', () => {
    const engine = createEngine();

    const result = engine.decide({
      conflictType: 'financial_divergence',
    });

    expect(result).toEqual({
      decision: 'case_opened_and_requires_review',
      caseType: 'financial_divergence',
      severity: 'high',
      caseStatus: 'under_review',
      initialAction: 'case_opened',
      reason: 'Relevant divergence requires reconciliation review',
      shouldOpenCase: true,
      autoResolved: false,
    });
  });

  it('deve abrir caso para regressão inválida de status sob revisão', () => {
    const engine = createEngine();

    const result = engine.decide({
      conflictType: 'invalid_status_regression',
    });

    expect(result.caseType).toBe('status_inconsistency');
    expect(result.severity).toBe('high');
    expect(result.caseStatus).toBe('under_review');
  });

  it('deve abrir caso para divergência de parcelas com pending_reprocessing', () => {
    const engine = createEngine();

    const result = engine.decide({
      conflictType: 'installment_divergence',
    });

    expect(result).toEqual({
      decision: 'case_opened_and_pending_reprocessing',
      caseType: 'installment_inconsistency',
      severity: 'medium',
      caseStatus: 'pending_reprocessing',
      initialAction: 'marked_for_reprocessing',
      reason: 'Installment inconsistency requires reprocessing',
      shouldOpenCase: true,
      autoResolved: false,
    });
  });

  it('deve abrir caso para divergência de pagador sob revisão', () => {
    const engine = createEngine();

    const result = engine.decide({
      conflictType: 'payer_identity_divergence',
    });

    expect(result.caseType).toBe('payer_inconsistency');
    expect(result.severity).toBe('high');
    expect(result.caseStatus).toBe('under_review');
  });

  it('deve auto resolver conflito conhecido e seguro', () => {
    const engine = createEngine();

    const result = engine.decide({
      conflictType: 'financial_divergence',
      repeatedKnownConflict: true,
      safelyAutoResolvable: true,
    });

    expect(result).toEqual({
      decision: 'case_opened_and_auto_resolved',
      caseType: 'financial_divergence',
      severity: 'high',
      caseStatus: 'auto_resolved',
      initialAction: 'auto_resolved',
      reason: 'Known conflict safely auto-resolved',
      shouldOpenCase: true,
      autoResolved: true,
    });
  });
});
