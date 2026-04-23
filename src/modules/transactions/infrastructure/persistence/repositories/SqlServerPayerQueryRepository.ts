import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { GetTransactionPayerQuery } from '../../../application/dto/GetTransactionPayerQuery';
import type { TransactionPayerDto } from '../../../application/dto/TransactionPayerDto';
import type { PayerQueryRepository } from '../../../application/ports/PayerQueryRepository';

type PayerRow = {
  id: number;
  external_id: string | null;
  name: string;
  email: string;
  document_type: string | null;
  has_document: boolean;
};

export class SqlServerPayerQueryRepository implements PayerQueryRepository {
  public async getByTransactionId(
    query: GetTransactionPayerQuery,
  ): Promise<TransactionPayerDto | null> {
    const request = await getSqlRequest();

    request.input('transactionId', sql.BigInt, query.transactionId);

    const result = await request.query<PayerRow>(`
      SELECT TOP (1)
        p.id,
        p.external_id,
        p.name,
        p.email,
        p.document_type,
        p.has_document
      FROM dbo.transactions t
      INNER JOIN dbo.payers p ON p.id = t.payer_id
      WHERE t.id = @transactionId
    `);

    const row = result.recordset[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      externalId: row.external_id ?? undefined,
      name: row.name,
      email: row.email,
      documentType: row.document_type ?? undefined,
      hasDocument: Boolean(row.has_document),
    };
  }
}
