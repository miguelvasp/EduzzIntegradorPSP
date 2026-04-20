export const CanonicalPsp = {
  PAGARME: 'pagarme',
  MERCADOPAGO: 'mercadopago',
} as const;

export type CanonicalPsp = (typeof CanonicalPsp)[keyof typeof CanonicalPsp];

export interface ExternalTransactionReferenceValueObject {
  psp: CanonicalPsp;
  externalId: string;
}

export interface CreateExternalTransactionReferenceInput {
  psp: CanonicalPsp;
  externalId: string;
}

export function createExternalTransactionReferenceValueObject(
  input: CreateExternalTransactionReferenceInput,
): ExternalTransactionReferenceValueObject {
  const psp = input.psp;
  const externalId = input.externalId.trim();

  if (psp.trim().length === 0) {
    throw new Error('External transaction reference must contain a PSP');
  }

  if (externalId.length === 0) {
    throw new Error('External transaction reference must contain a usable externalId');
  }

  return {
    psp,
    externalId,
  };
}

export function getExternalTransactionReferenceKey(reference: ExternalTransactionReferenceValueObject): string {
  return `${reference.psp}:${reference.externalId}`;
}
