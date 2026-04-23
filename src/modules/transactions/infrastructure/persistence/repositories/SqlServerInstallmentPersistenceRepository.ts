import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type {
  InstallmentPersistenceRepository,
  PersistedInstallmentRecord,
} from '../../../application/ports/InstallmentPersistenceRepository';
import type { InstallmentEntity } from '../../../domain/entities';

type InsertedInstallmentRow = {
  id: number;
  installment_number: number;
  status: InstallmentEntity['status'];
  due_date: Date | null;
  paid_at: Date | null;
};

export class SqlServerInstallmentPersistenceRepository implements InstallmentPersistenceRepository {
  public async replaceByTransactionId(
    transactionId: number,
    installments: InstallmentEntity[],
  ): Promise<PersistedInstallmentRecord[]> {
    const deleteRequest = await getSqlRequest();

    await deleteRequest
      .input('transactionId', sql.BigInt, transactionId)
      .query('DELETE FROM dbo.installments WHERE transaction_id = @transactionId');

    const persisted: PersistedInstallmentRecord[] = [];

    for (const installment of installments) {
      const insertRequest = await getSqlRequest();

      const result = await insertRequest
        .input('transactionId', sql.BigInt, transactionId)
        .input('installmentNumber', sql.Int, installment.installmentNumber)
        .input('amount', sql.BigInt, installment.amount.amountInCents)
        .input('fees', sql.BigInt, installment.fees.amountInCents)
        .input('status', sql.NVarChar(40), installment.status)
        .input('dueDate', sql.DateTime2, installment.dueDate ?? null)
        .input('paidAt', sql.DateTime2, installment.paidAt ?? null).query<InsertedInstallmentRow>(`
          INSERT INTO dbo.installments
          (
            transaction_id,
            installment_number,
            amount,
            fees,
            status,
            due_date,
            paid_at
          )
          OUTPUT
            INSERTED.id,
            INSERTED.installment_number,
            INSERTED.status,
            INSERTED.due_date,
            INSERTED.paid_at
          VALUES
          (
            @transactionId,
            @installmentNumber,
            @amount,
            @fees,
            @status,
            @dueDate,
            @paidAt
          )
        `);

      const row = result.recordset[0];

      persisted.push({
        id: Number(row.id),
        installmentNumber: row.installment_number,
        status: row.status,
        dueDate: row.due_date ?? undefined,
        paidAt: row.paid_at ?? undefined,
      });
    }

    return persisted;
  }
}
