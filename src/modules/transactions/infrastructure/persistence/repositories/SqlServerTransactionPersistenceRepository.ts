import { logDatabaseOperationFailure } from '../../../../../app/server/logging/databaseOperationLogger';
import { PspType } from '../../../../shared/domain/enums/pspType';
import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { TransactionPersistenceRepository } from '../../../application/ports/TransactionPersistenceRepository';
import type {
  CanonicalPaymentMethod,
  CanonicalTransactionStatus,
  InstallmentEntity,
  PayerSnapshot,
  TransactionEntity,
} from '../../../domain/entities';
import {
  createDocumentHashValueObject,
  createExternalTransactionReferenceValueObject,
  createMoneyValueObject,
} from '../../../domain/value-objects';

type TransactionRow = {
  id: number;
  psp: PspType;
  external_id: string;
  status: CanonicalTransactionStatus;
  payment_method: CanonicalPaymentMethod;
  original_amount: number;
  net_amount: number;
  fees: number;
  installment_count: number;
  currency: string;
  psp_created_at: Date;
  psp_updated_at: Date;
  first_seen_at: Date;
  last_synced_at: Date | null;
  payer_external_id: string | null;
  payer_name: string;
  payer_email: string;
  payer_document_hash: string;
  payer_document_type: 'cpf' | 'cnpj';
};

type InstallmentRow = {
  id: number;
  transaction_id: number;
  installment_number: number;
  amount: number;
  fees: number;
  status: InstallmentEntity['status'];
  due_date: Date | null;
  paid_at: Date | null;
};

export class SqlServerTransactionPersistenceRepository implements TransactionPersistenceRepository {
  public async findByExternalReference(
    psp: PspType,
    externalId: string,
  ): Promise<TransactionEntity | null> {
    try {
      const request = await getSqlRequest();

      const transactionResult = await request
        .input('psp', sql.NVarChar(30), psp)
        .input('externalId', sql.NVarChar(100), externalId).query<TransactionRow>(`
          SELECT TOP (1)
            t.id,
            t.psp,
            t.external_id,
            t.status,
            t.payment_method,
            t.original_amount,
            t.net_amount,
            t.fees,
            t.installment_count,
            t.currency,
            t.psp_created_at,
            t.psp_updated_at,
            t.first_seen_at,
            t.last_synced_at,
            s.external_id AS payer_external_id,
            s.name AS payer_name,
            s.email AS payer_email,
            s.document_hash AS payer_document_hash,
            s.document_type AS payer_document_type
          FROM dbo.transactions t
          OUTER APPLY (
            SELECT TOP (1)
              external_id,
              name,
              email,
              document_hash,
              document_type
            FROM dbo.transaction_payer_snapshots s
            WHERE s.transaction_id = t.id
            ORDER BY s.snapshot_version DESC, s.id DESC
          ) s
          WHERE t.psp = @psp
            AND t.external_id = @externalId
        `);

      const transactionRow = transactionResult.recordset[0];

      if (!transactionRow) {
        return null;
      }

      const installmentsRequest = await getSqlRequest();

      const installmentsResult = await installmentsRequest.input(
        'transactionId',
        sql.BigInt,
        transactionRow.id,
      ).query<InstallmentRow>(`
          SELECT
            id,
            transaction_id,
            installment_number,
            amount,
            fees,
            status,
            due_date,
            paid_at
          FROM dbo.installments
          WHERE transaction_id = @transactionId
          ORDER BY installment_number ASC
        `);

      return this.mapTransaction(transactionRow, installmentsResult.recordset);
    } catch (error) {
      logDatabaseOperationFailure({
        repository: 'SqlServerTransactionPersistenceRepository',
        operation: 'findByExternalReference',
        entity: 'transactions',
        error,
        context: {
          psp,
          externalId,
        },
      });

      throw error;
    }
  }

  public async insert(params: {
    transaction: TransactionEntity;
    payerId: number;
    lastSyncedAt: Date;
  }): Promise<number> {
    try {
      const request = await getSqlRequest();

      const result = await request
        .input('psp', sql.NVarChar(30), params.transaction.externalReference.psp)
        .input('externalId', sql.NVarChar(100), params.transaction.externalReference.externalId)
        .input('status', sql.NVarChar(40), params.transaction.status)
        .input('paymentMethod', sql.NVarChar(30), params.transaction.paymentMethod)
        .input('originalAmount', sql.BigInt, params.transaction.originalAmount.amountInCents)
        .input('netAmount', sql.BigInt, params.transaction.netAmount.amountInCents)
        .input('fees', sql.BigInt, params.transaction.fees.amountInCents)
        .input('installmentCount', sql.Int, params.transaction.installmentCount)
        .input('currency', sql.Char(3), params.transaction.currency)
        .input('payerId', sql.BigInt, params.payerId)
        .input('pspCreatedAt', sql.DateTime2, params.transaction.createdAt)
        .input('pspUpdatedAt', sql.DateTime2, params.transaction.updatedAt)
        .input('lastSyncedAt', sql.DateTime2, params.lastSyncedAt).query<{ id: number }>(`
          INSERT INTO dbo.transactions
          (
            psp,
            external_id,
            status,
            payment_method,
            original_amount,
            net_amount,
            fees,
            installment_count,
            currency,
            payer_id,
            psp_created_at,
            psp_updated_at,
            last_synced_at,
            last_status_changed_at
          )
          OUTPUT INSERTED.id
          VALUES
          (
            @psp,
            @externalId,
            @status,
            @paymentMethod,
            @originalAmount,
            @netAmount,
            @fees,
            @installmentCount,
            @currency,
            @payerId,
            @pspCreatedAt,
            @pspUpdatedAt,
            @lastSyncedAt,
            @pspUpdatedAt
          )
        `);

      return result.recordset[0].id;
    } catch (error) {
      logDatabaseOperationFailure({
        repository: 'SqlServerTransactionPersistenceRepository',
        operation: 'insert',
        entity: 'transactions',
        error,
        context: {
          psp: params.transaction.externalReference.psp,
          externalId: params.transaction.externalReference.externalId,
          payerId: params.payerId,
        },
      });

      throw error;
    }
  }

  public async update(params: {
    transactionId: number;
    transaction: TransactionEntity;
    payerId: number;
    lastSyncedAt: Date;
  }): Promise<void> {
    try {
      const request = await getSqlRequest();

      await request
        .input('transactionId', sql.BigInt, params.transactionId)
        .input('status', sql.NVarChar(40), params.transaction.status)
        .input('paymentMethod', sql.NVarChar(30), params.transaction.paymentMethod)
        .input('originalAmount', sql.BigInt, params.transaction.originalAmount.amountInCents)
        .input('netAmount', sql.BigInt, params.transaction.netAmount.amountInCents)
        .input('fees', sql.BigInt, params.transaction.fees.amountInCents)
        .input('installmentCount', sql.Int, params.transaction.installmentCount)
        .input('currency', sql.Char(3), params.transaction.currency)
        .input('payerId', sql.BigInt, params.payerId)
        .input('pspUpdatedAt', sql.DateTime2, params.transaction.updatedAt)
        .input('lastSyncedAt', sql.DateTime2, params.lastSyncedAt).query(`
          UPDATE dbo.transactions
          SET
            status = @status,
            payment_method = @paymentMethod,
            original_amount = @originalAmount,
            net_amount = @netAmount,
            fees = @fees,
            installment_count = @installmentCount,
            currency = @currency,
            payer_id = @payerId,
            psp_updated_at = @pspUpdatedAt,
            last_synced_at = @lastSyncedAt,
            last_status_changed_at = CASE
              WHEN status <> @status THEN @pspUpdatedAt
              ELSE last_status_changed_at
            END,
            updated_at = SYSUTCDATETIME()
          WHERE id = @transactionId
        `);
    } catch (error) {
      logDatabaseOperationFailure({
        repository: 'SqlServerTransactionPersistenceRepository',
        operation: 'update',
        entity: 'transactions',
        error,
        context: {
          transactionId: params.transactionId,
          psp: params.transaction.externalReference.psp,
          externalId: params.transaction.externalReference.externalId,
          payerId: params.payerId,
        },
      });

      throw error;
    }
  }

  private mapTransaction(
    transactionRow: TransactionRow,
    installmentRows: InstallmentRow[],
  ): TransactionEntity {
    const payerSnapshot: PayerSnapshot = {
      externalId: transactionRow.payer_external_id ?? undefined,
      name: transactionRow.payer_name,
      email: transactionRow.payer_email,
      documentHash: createDocumentHashValueObject(transactionRow.payer_document_hash),
      documentType: transactionRow.payer_document_type,
    };

    return {
      id: transactionRow.id,
      externalReference: createExternalTransactionReferenceValueObject({
        psp: transactionRow.psp === PspType.MERCADO_PAGO ? 'mercadopago' : 'pagarme',
        externalId: transactionRow.external_id,
      }),
      paymentMethod: transactionRow.payment_method,
      status: transactionRow.status,
      originalAmount: createMoneyValueObject({
        amountInCents: transactionRow.original_amount,
      }),
      netAmount: createMoneyValueObject({
        amountInCents: transactionRow.net_amount,
      }),
      fees: createMoneyValueObject({
        amountInCents: transactionRow.fees,
      }),
      installmentCount: transactionRow.installment_count,
      currency: transactionRow.currency,
      createdAt: transactionRow.psp_created_at,
      updatedAt: transactionRow.psp_updated_at,
      payerSnapshot,
      installments: installmentRows.map((installment) => ({
        id: installment.id,
        transactionId: installment.transaction_id,
        installmentNumber: installment.installment_number,
        amount: createMoneyValueObject({
          amountInCents: installment.amount,
        }),
        fees: createMoneyValueObject({
          amountInCents: installment.fees,
        }),
        status: installment.status,
        dueDate: installment.due_date ?? undefined,
        paidAt: installment.paid_at ?? undefined,
      })),
      metadata: {
        canonicalizedAt: transactionRow.first_seen_at,
        lastSynchronizedAt: transactionRow.last_synced_at ?? undefined,
      },
    };
  }
}
