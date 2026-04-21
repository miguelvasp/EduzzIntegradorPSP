import type { TransactionInstallmentSummaryDto } from './TransactionInstallmentSummaryDto';
import type { TransactionPayerDto } from './TransactionPayerDto';

export type TransactionDetailDto = {
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
  payer?: TransactionPayerDto;
  installments: TransactionInstallmentSummaryDto[];
};
