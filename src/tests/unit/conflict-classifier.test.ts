import { describe, expect, it } from 'vitest';
import { ConflictClassifier } from '../../modules/transactions/domain/services/ConflictClassifier';

describe('ConflictClassifier', () => {
  it('deve classificar regressão inválida de status', () => {
    const classifier = new ConflictClassifier();

    const result = classifier.classify({
      invalidStatusRegression: true,
    });

    expect(result).toBe('invalid_status_regression');
  });

  it('deve classificar divergência financeira', () => {
    const classifier = new ConflictClassifier();

    const result = classifier.classify({
      financialFieldDiverged: true,
    });

    expect(result).toBe('financial_divergence');
  });

  it('deve classificar divergência de pagador', () => {
    const classifier = new ConflictClassifier();

    const result = classifier.classify({
      payerIdentityDiverged: true,
    });

    expect(result).toBe('payer_identity_divergence');
  });

  it('deve classificar divergência de parcelas', () => {
    const classifier = new ConflictClassifier();

    const result = classifier.classify({
      installmentDiverged: true,
    });

    expect(result).toBe('installment_divergence');
  });

  it('deve cair em divergência auditável por padrão', () => {
    const classifier = new ConflictClassifier();

    const result = classifier.classify({});

    expect(result).toBe('audit_field_divergence');
  });
});
