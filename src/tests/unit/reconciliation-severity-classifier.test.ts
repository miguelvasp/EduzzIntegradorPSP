import { describe, expect, it } from 'vitest';
import { ReconciliationSeverityClassifier } from '../../modules/reconciliation/application/services/ReconciliationSeverityClassifier';

describe('ReconciliationSeverityClassifier', () => {
  it('deve classificar financial_divergence como high', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('financial_divergence')).toBe('high');
  });

  it('deve classificar status_inconsistency como high', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('status_inconsistency')).toBe('high');
  });

  it('deve classificar payer_inconsistency como high', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('payer_inconsistency')).toBe('high');
  });

  it('deve classificar installment_inconsistency como medium', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('installment_inconsistency')).toBe('medium');
  });

  it('deve classificar audit_field_conflict como critical', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('audit_field_conflict')).toBe('critical');
  });

  it('deve classificar unresolved_merge como low', () => {
    const classifier = new ReconciliationSeverityClassifier();

    expect(classifier.classify('unresolved_merge')).toBe('low');
  });
});
