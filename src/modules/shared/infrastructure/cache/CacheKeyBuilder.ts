type ListTransactionsCacheKeyInput = {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  psp?: string;
  payerDocument?: string;
};

export class CacheKeyBuilder {
  public buildTransactionsListKey(input: ListTransactionsCacheKeyInput): string {
    return this.buildKey('transactions:list', {
      page: input.page,
      limit: input.limit,
      startDate: input.startDate ?? '',
      endDate: input.endDate ?? '',
      status: input.status ?? '',
      psp: input.psp ?? '',
      payerDocument: input.payerDocument ?? '',
    });
  }

  public buildTransactionDetailKey(transactionId: number): string {
    return this.buildKey('transactions:detail', {
      transactionId,
    });
  }

  public buildTransactionInstallmentsKey(transactionId: number): string {
    return this.buildKey('transactions:installments', {
      transactionId,
    });
  }

  public buildInstallmentDetailKey(transactionId: number, installmentId: number): string {
    return this.buildKey('transactions:installment-detail', {
      transactionId,
      installmentId,
    });
  }

  public buildTransactionPayerKey(transactionId: number): string {
    return this.buildKey('transactions:payer', {
      transactionId,
    });
  }

  private buildKey(prefix: string, values: Record<string, string | number>): string {
    const normalized = Object.keys(values)
      .sort()
      .map((key) => `${key}=${String(values[key])}`)
      .join('|');

    return `${prefix}|${normalized}`;
  }
}
