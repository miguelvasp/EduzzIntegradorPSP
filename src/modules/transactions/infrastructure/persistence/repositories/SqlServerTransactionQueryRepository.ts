import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { GetTransactionByIdQuery } from '../../../application/dto/GetTransactionByIdQuery';
import type { GetTransactionPayerQuery } from '../../../application/dto/GetTransactionPayerQuery';
import type { ListTransactionsQuery } from '../../../application/dto/ListTransactionsQuery';
import type { TransactionDetailDto } from '../../../application/dto/TransactionDetailDto';
import type { TransactionInstallmentSummaryDto } from '../../../application/dto/TransactionInstallmentSummaryDto';
import type { TransactionListItemDto } from '../../../application/dto/TransactionListItemDto';
import type { TransactionPayerDto } from '../../../application/dto/TransactionPayerDto';
import type { TransactionQueryRepository } from '../../../application/ports/TransactionQueryRepository';

type TransactionListRow = {
  id: number;
  external_id: string;
  psp: string;
  status: string;
  original_amount: number;
  net_amount: number;
  fees: number;
  installment_count: number;
  currency: string;
  psp_created_at: Date;
  psp_updated_at: Date;
};

type CountRow = {
  total: number;
};

type TransactionDetailRow = {
  id: number;
  external_id: string;
  psp: string;
  status: string;
  original_amount: number;
  net_amount: number;
  fees: number;
  installment_count: number;
  currency: string;
  psp_created_at: Date;
  psp_updated_at: Date;
  payer_id: number | null;
  payer_external_id: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_document_type: string | null;
  payer_has_document: boolean | null;
};

type InstallmentSummaryRow = {
  id: number;
  installment_number: number;
  amount: number;
  fees: number;
  status: string;
  paid_at: Date | null;
  updated_at: Date;
};

type TransactionPayerRow = {
  id: number;
  external_id: string | null;
  name: string;
  email: string;
  document_type: string | null;
  has_document: boolean;
};

export class SqlServerTransactionQueryRepository implements TransactionQueryRepository {
  public async list(query: ListTransactionsQuery): Promise<{
    items: TransactionListItemDto[];
    total: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    const request = await getSqlRequest();

    request
      .input('startDate', sql.DateTime2, query.startDate ? new Date(query.startDate) : null)
      .input('endDate', sql.DateTime2, query.endDate ? new Date(query.endDate) : null)
      .input('status', sql.NVarChar(40), query.status ?? null)
      .input('psp', sql.NVarChar(30), query.psp ?? null)
      .input('payerDocument', sql.Char(64), query.payerDocument ?? null)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, query.limit);

    const itemsResult = await request.query<TransactionListRow>(`
      SELECT
        t.id,
        t.external_id,
        t.psp,
        t.status,
        t.original_amount,
        t.net_amount,
        t.fees,
        t.installment_count,
        t.currency,
        t.psp_created_at,
        t.psp_updated_at
      FROM dbo.transactions t
      LEFT JOIN dbo.payers p ON p.id = t.payer_id
      WHERE (@startDate IS NULL OR t.psp_created_at >= @startDate)
        AND (@endDate IS NULL OR t.psp_created_at <= @endDate)
        AND (@status IS NULL OR t.status = @status)
        AND (@psp IS NULL OR t.psp = @psp)
        AND (@payerDocument IS NULL OR p.document_hash = @payerDocument)
      ORDER BY t.id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countRequest = await getSqlRequest();

    countRequest
      .input('startDate', sql.DateTime2, query.startDate ? new Date(query.startDate) : null)
      .input('endDate', sql.DateTime2, query.endDate ? new Date(query.endDate) : null)
      .input('status', sql.NVarChar(40), query.status ?? null)
      .input('psp', sql.NVarChar(30), query.psp ?? null)
      .input('payerDocument', sql.Char(64), query.payerDocument ?? null);

    const countResult = await countRequest.query<CountRow>(`
      SELECT COUNT(1) AS total
      FROM dbo.transactions t
      LEFT JOIN dbo.payers p ON p.id = t.payer_id
      WHERE (@startDate IS NULL OR t.psp_created_at >= @startDate)
        AND (@endDate IS NULL OR t.psp_created_at <= @endDate)
        AND (@status IS NULL OR t.status = @status)
        AND (@psp IS NULL OR t.psp = @psp)
        AND (@payerDocument IS NULL OR p.document_hash = @payerDocument)
    `);

    return {
      items: itemsResult.recordset.map((row: TransactionListRow) => ({
        id: row.id,
        externalId: row.external_id,
        psp: row.psp,
        status: row.status,
        originalAmount: row.original_amount,
        netAmount: row.net_amount,
        fees: row.fees,
        installmentCount: row.installment_count,
        currency: row.currency,
        createdAt: row.psp_created_at.toISOString(),
        updatedAt: row.psp_updated_at.toISOString(),
      })),
      total: countResult.recordset[0]?.total ?? 0,
    };
  }

  public async getById(query: GetTransactionByIdQuery): Promise<TransactionDetailDto | null> {
    const request = await getSqlRequest();

    request.input('id', sql.BigInt, query.id);

    const result = await request.query<TransactionDetailRow>(`
      SELECT TOP (1)
        t.id,
        t.external_id,
        t.psp,
        t.status,
        t.original_amount,
        t.net_amount,
        t.fees,
        t.installment_count,
        t.currency,
        t.psp_created_at,
        t.psp_updated_at,
        p.id AS payer_id,
        p.external_id AS payer_external_id,
        p.name AS payer_name,
        p.email AS payer_email,
        p.document_type AS payer_document_type,
        p.has_document AS payer_has_document
      FROM dbo.transactions t
      LEFT JOIN dbo.payers p ON p.id = t.payer_id
      WHERE t.id = @id
    `);

    const row = result.recordset[0];

    if (!row) {
      return null;
    }

    const installmentRequest = await getSqlRequest();
    installmentRequest.input('transactionId', sql.BigInt, query.id);

    const installmentResult = await installmentRequest.query<InstallmentSummaryRow>(`
      SELECT
        id,
        installment_number,
        amount,
        fees,
        status,
        paid_at,
        updated_at
      FROM dbo.installments
      WHERE transaction_id = @transactionId
      ORDER BY installment_number ASC
    `);

    const installments: TransactionInstallmentSummaryDto[] = installmentResult.recordset.map(
      (item: InstallmentSummaryRow) => ({
        id: item.id,
        installmentNumber: item.installment_number,
        amount: item.amount,
        fees: item.fees,
        status: item.status,
        paidAt: item.paid_at ? item.paid_at.toISOString() : undefined,
        updatedAt: item.updated_at.toISOString(),
      }),
    );

    return {
      id: row.id,
      externalId: row.external_id,
      psp: row.psp,
      status: row.status,
      originalAmount: row.original_amount,
      netAmount: row.net_amount,
      fees: row.fees,
      installmentCount: row.installment_count,
      currency: row.currency,
      createdAt: row.psp_created_at.toISOString(),
      updatedAt: row.psp_updated_at.toISOString(),
      payer: row.payer_id
        ? {
            id: row.payer_id,
            externalId: row.payer_external_id ?? undefined,
            name: row.payer_name ?? '',
            email: row.payer_email ?? '',
            documentType: row.payer_document_type ?? undefined,
            hasDocument: Boolean(row.payer_has_document),
          }
        : undefined,
      installments,
    };
  }

  public async getPayerByTransactionId(
    query: GetTransactionPayerQuery,
  ): Promise<TransactionPayerDto | null> {
    const request = await getSqlRequest();

    request.input('transactionId', sql.BigInt, query.transactionId);

    const result = await request.query<TransactionPayerRow>(`
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
