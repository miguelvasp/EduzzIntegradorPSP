export interface DocumentHashValueObject {
  value: string;
}

export function createDocumentHashValueObject(value: string): DocumentHashValueObject {
  const normalizedValue = value.trim();

  if (normalizedValue.length < 16) {
    throw new Error('Document hash must have at least 16 characters');
  }

  if (/^\d+$/.test(normalizedValue)) {
    throw new Error('Document hash cannot be a plain numeric document');
  }

  if (/[./\-\s]/.test(normalizedValue)) {
    throw new Error('Document hash cannot contain document formatting characters');
  }

  return {
    value: normalizedValue,
  };
}
