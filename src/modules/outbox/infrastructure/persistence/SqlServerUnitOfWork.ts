import {
  createSqlTransaction,
  runWithSqlTransaction,
} from '../../../shared/infrastructure/persistence/SqlServerConnection';
import type { UnitOfWork } from '../../application/ports/UnitOfWork';

export class SqlServerUnitOfWork implements UnitOfWork {
  public async execute<T>(work: () => Promise<T>): Promise<T> {
    const transaction = await createSqlTransaction();

    try {
      const result = await runWithSqlTransaction(transaction, work);

      await transaction.commit();

      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
