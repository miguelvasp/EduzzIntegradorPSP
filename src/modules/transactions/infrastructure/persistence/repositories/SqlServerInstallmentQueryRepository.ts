import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { GetInstallmentByIdQuery } from '../../../application/dto/GetInstallmentByIdQuery';
import type { InstallmentDetailDto } from '../../../application/dto/InstallmentDetailDto';
import type { ListTransactionInstallmentsQuery } from '../../../application/dto/ListTransactionInstallmentsQuery';
import type { TransactionInstallmentDto } from '../../../application/dto/TransactionInstallmentDto';
import type { InstallmentQueryRepository } from '../../../application/ports/InstallmentQueryRepository';

type TransactionExistsRow = {
  exists_flag: number;
};

type InstallmentRow = {
  id: number;
  transaction_id: number;
  installment_number: number;
  amount: number;
  fees: number;
  status: string;
  due_date: Date | null;
  paid_at: Date | null;
  updated_at: Date;
};

export class SqlServerInstallmentQueryRepository implements InstallmentQueryRepository {
  public async listByTransactionId(
    query: ListTransactionInstallmentsQuery,
  ): Promise<TransactionInstallmentDto[] | null> {
    const existsRequest = await getSqlRequest();
    existsRequest.input('transactionId', sql.BigInt, query.transactionId);

    const existsResult = await existsRequest.query<TransactionExistsRow>(`
      SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM dbo.transactions
        WHERE id = @transactionId
      ) THEN 1 ELSE 0 END AS exists_flag
    `);

    if ((existsResult.recordset[0]?.exists_flag ?? 0) === 0) {
      return null;
    }

    const request = await getSqlRequest();
    request.input('transactionId', sql.BigInt, query.transactionId);

    const result = await request.query<InstallmentRow>(`
      SELECT
        id,
        transaction_id,
        installment_number,
        amount,
        fees,
        status,
        due_date,
        paid_at,
        updated_at
      FROM dbo.installments
      WHERE transaction_id = @transactionId
      ORDER BY installment_number ASC
    `);

    return result.recordset.map((row) => ({
      id: row.id,
      transactionId: row.transaction_id,
      installmentNumber: row.installment_number,
      amount: row.amount,
      fees: row.fees,
      status: row.status,
      dueAt: row.due_date ? row.due_date.toISOString() : undefined,
      paidAt: row.paid_at ? row.paid_at.toISOString() : undefined,
      updatedAt: row.updated_at.toISOString(),
    }));
  }

  public async getById(query: GetInstallmentByIdQuery): Promise<InstallmentDetailDto | null> {
    const request = await getSqlRequest();

    request
      .input('transactionId', sql.BigInt, query.transactionId)
      .input('installmentId', sql.BigInt, query.installmentId);

    const result = await request.query<InstallmentRow>(`
      SELECT TOP (1)
        id,
        transaction_id,
        installment_number,
        amount,
        fees,
        status,
        due_date,
        paid_at,
        updated_at
      FROM dbo.installments
      WHERE transaction_id = @transactionId
        AND id = @installmentId
    `);

    const row = result.recordset[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      transactionId: row.transaction_id,
      installmentNumber: row.installment_number,
      amount: row.amount,
      fees: row.fees,
      status: row.status,
      dueAt: row.due_date ? row.due_date.toISOString() : undefined,
      paidAt: row.paid_at ? row.paid_at.toISOString() : undefined,
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
