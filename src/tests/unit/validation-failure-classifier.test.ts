import { describe, expect, it } from 'vitest';
import { ValidationFailureClassifier } from '../../modules/sync/application/validation/ValidationFailureClassifier';

describe('ValidationFailureClassifier', () => {
  it('deve classificar falha de validação de forma estruturada', () => {
    const classifier = new ValidationFailureClassifier();

    const result = classifier.classify({
      code: 'missing_payer',
      message: 'Payer data is required',
      field: 'payerSnapshot',
    });

    expect(result).toEqual({
      code: 'missing_payer',
      message: 'Payer data is required',
      field: 'payerSnapshot',
    });
  });
});
