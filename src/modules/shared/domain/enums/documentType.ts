export const DocumentType = {
  CPF: 'cpf',
  CNPJ: 'cnpj',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
