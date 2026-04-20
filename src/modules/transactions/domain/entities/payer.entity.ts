import type { DocumentHashValueObject } from '../value-objects';

export const CanonicalDocumentType = {
  CPF: 'cpf',
  CNPJ: 'cnpj',
} as const;

export type CanonicalDocumentType = (typeof CanonicalDocumentType)[keyof typeof CanonicalDocumentType];

export interface PayerSnapshot {
  externalId?: string;
  name: string;
  email: string;
  documentHash: DocumentHashValueObject;
  documentType: CanonicalDocumentType;
}
