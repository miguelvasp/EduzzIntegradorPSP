import type {
  BusinessValidationFailure,
  BusinessValidationFailureCode,
} from './BusinessValidationResult';

export class ValidationFailureClassifier {
  public classify(params: {
    code: BusinessValidationFailureCode;
    message: string;
    field?: string;
  }): BusinessValidationFailure {
    return {
      code: params.code,
      message: params.message,
      field: params.field,
    };
  }
}
