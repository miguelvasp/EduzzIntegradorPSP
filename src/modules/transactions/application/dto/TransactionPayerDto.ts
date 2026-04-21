export type TransactionPayerDto = {
  id?: number;
  externalId?: string;
  name: string;
  email: string;
  documentType?: string;
  hasDocument: boolean;
};
