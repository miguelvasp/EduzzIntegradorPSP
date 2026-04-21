export type TransactionListItemDto = {
  id: number;
  externalId: string;
  psp: string;
  status: string;
  originalAmount: number;
  netAmount: number;
  fees: number;
  installmentCount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};
