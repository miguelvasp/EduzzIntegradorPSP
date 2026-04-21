export type TransactionInstallmentSummaryDto = {
  id: number;
  installmentNumber: number;
  amount: number;
  fees: number;
  status: string;
  paidAt?: string;
  updatedAt?: string;
};
