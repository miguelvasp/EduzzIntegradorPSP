import sql, {
  type ConnectionPool,
  type Request,
  type config as SqlConfig,
  type Transaction,
} from 'mssql';
import { AsyncLocalStorage } from 'node:async_hooks';
import { config } from '../../../../app/config/env';

type SqlExecutionContext = {
  transaction?: Transaction;
};

const executionContext = new AsyncLocalStorage<SqlExecutionContext>();
let poolPromise: Promise<ConnectionPool> | null = null;

function buildSqlServerConfig(): SqlConfig {
  const password = config.database.password;

  if (!password) {
    throw new Error('Database password is required for SQL Server connection');
  }

  return {
    server: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password,
    pool: {
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: config.database.encrypt,
      trustServerCertificate: config.database.trustServerCertificate,
    },
    connectionTimeout: config.database.connectionTimeoutMs,
    requestTimeout: config.database.connectionTimeoutMs,
  };
}

export async function getSqlServerPool(): Promise<ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildSqlServerConfig()).connect();
  }

  return poolPromise;
}

export async function closeSqlServerPool(): Promise<void> {
  if (!poolPromise) {
    return;
  }

  const pool = await poolPromise;
  await pool.close();
  poolPromise = null;
}

export async function createSqlTransaction(): Promise<Transaction> {
  const pool = await getSqlServerPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  return transaction;
}

export function runWithSqlTransaction<T>(
  transaction: Transaction,
  work: () => Promise<T>,
): Promise<T> {
  return executionContext.run({ transaction }, work);
}

export async function getSqlRequest(): Promise<Request> {
  const currentTransaction = executionContext.getStore()?.transaction;

  if (currentTransaction) {
    return currentTransaction.request();
  }

  const pool = await getSqlServerPool();

  return pool.request();
}

export { sql };
