import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { appLogger } from '../../../../app/server/logging';
import { getSqlServerPool } from './SqlServerConnection';

const SCRIPT_FILES = [
  'V002__create_core_transaction_tables.sql',
  'V003__create_operational_tables.sql',
  'V004__create_indexes.sql',
  'V005__create_audit_traceability_tables.sql',
  'V006__create_audit_traceability_indexes.sql',
  'V007__create_conflict_rejection_reconciliation_tables.sql',
  'V008__create_conflict_rejection_reconciliation_indexes.sql',
  'V009__create_outbox_inbox_tables.sql',
  'V010__create_outbox_inbox_indexes.sql',
] as const;

function splitSqlBatches(content: string): string[] {
  return content
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

export async function bootstrapSqlServerSchema(): Promise<void> {
  const pool = await getSqlServerPool();

  for (const file of SCRIPT_FILES) {
    const fullPath = resolve(process.cwd(), 'scripts', file);
    const scriptContent = await readFile(fullPath, 'utf-8');
    const batches = splitSqlBatches(scriptContent);

    for (const batch of batches) {
      await pool.request().batch(batch);
    }

    appLogger.info({
      eventType: 'startup',
      message: `SQL schema script executed: ${file}`,
      status: 'completed',
      module: 'persistence',
      component: 'schema-bootstrap',
    });
  }
}
