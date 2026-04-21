export type InstallmentDetailDto = {
  id: number;
  transactionId: number;
  installmentNumber: number;
  amount: number;
  fees: number;
  status: string;
  dueAt?: string;
  paidAt?: string;
  updatedAt?: string;
};
