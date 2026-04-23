import type { GetTransactionPayerQuery } from '../dto/GetTransactionPayerQuery';
import type { TransactionPayerDto } from '../dto/TransactionPayerDto';

export interface PayerQueryRepository {
  getByTransactionId(query: GetTransactionPayerQuery): Promise<TransactionPayerDto | null>;
}
