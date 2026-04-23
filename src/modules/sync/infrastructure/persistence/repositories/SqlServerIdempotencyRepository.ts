import { createHash } from 'node:crypto';
import { logDatabaseOperationFailure } from '../../../../../app/server/logging/databaseOperationLogger';
import {
  getSqlRequest,
  sql,
} from '../../../../shared/infrastructure/persistence/SqlServerConnection';
import type { TransactionPersistenceRepository } from '../../../../transactions/application/ports/TransactionPersistenceRepository';
import type {
  ExistingTransactionRecord,
  IdempotencyKeyInput,
  IdempotencyRepository,
  RegisterIdempotencyDecisionInput,
} from '../../../application/ports/IdempotencyRepository';

export class SqlServerIdempotencyRepository implements IdempotencyRepository {
  public constructor(
    private readonly transactionPersistenceRepository: TransactionPersistenceRepository,
  ) {}

  public async findTransactionByKey(
    key: IdempotencyKeyInput,
  ): Promise<ExistingTransactionRecord | null> {
    try {
      const transaction = await this.transactionPersistenceRepository.findByExternalReference(
        key.psp,
        key.externalId,
      );

      if (!transaction) {
        return null;
      }

      return {
        transaction,
      };
    } catch (error) {
      logDatabaseOperationFailure({
        repository: 'SqlServerIdempotencyRepository',
        operation: 'findTransactionByKey',
        entity: 'idempotency_registry',
        error,
        context: {
          psp: key.psp,
          externalId: key.externalId,
        },
      });

      throw error;
    }
  }

  public async registerDecision(input: RegisterIdempotencyDecisionInput): Promise<void> {
    try {
      const request = await getSqlRequest();

      const scope = this.buildScope(input.key);
      const idempotencyKey = this.buildIdempotencyKey(input.key);
      const resourceType = 'transaction';
      const requestFingerprint = this.buildRequestFingerprint(input.key);
      const status = input.decision;
      const expiresAt = this.buildExpiresAt();

      await request
        .input('scope', sql.NVarChar(50), scope)
        .input('idempotencyKey', sql.NVarChar(200), idempotencyKey)
        .input('resourceType', sql.NVarChar(50), resourceType)
        .input('resourceId', sql.BigInt, null)
        .input('requestFingerprint', sql.Char(64), requestFingerprint)
        .input('status', sql.NVarChar(30), status)
        .input('expiresAt', sql.DateTime2, expiresAt).query(`
          MERGE dbo.idempotency_registry AS target
          USING (
            SELECT
              @scope AS scope,
              @idempotencyKey AS idempotency_key,
              @resourceType AS resource_type,
              @resourceId AS resource_id,
              @requestFingerprint AS request_fingerprint,
              @status AS status,
              @expiresAt AS expires_at
          ) AS source
          ON target.scope = source.scope
             AND target.idempotency_key = source.idempotency_key
          WHEN MATCHED THEN
            UPDATE SET
              resource_type = source.resource_type,
              resource_id = source.resource_id,
              request_fingerprint = source.request_fingerprint,
              status = source.status,
              last_seen_at = SYSUTCDATETIME(),
              expires_at = source.expires_at
          WHEN NOT MATCHED THEN
            INSERT
            (
              scope,
              idempotency_key,
              resource_type,
              resource_id,
              request_fingerprint,
              status,
              first_seen_at,
              last_seen_at,
              expires_at
            )
            VALUES
            (
              source.scope,
              source.idempotency_key,
              source.resource_type,
              source.resource_id,
              source.request_fingerprint,
              source.status,
              SYSUTCDATETIME(),
              SYSUTCDATETIME(),
              source.expires_at
            );
        `);
    } catch (error) {
      logDatabaseOperationFailure({
        repository: 'SqlServerIdempotencyRepository',
        operation: 'registerDecision',
        entity: 'idempotency_registry',
        error,
        context: {
          psp: input.key.psp,
          externalId: input.key.externalId,
          decision: input.decision,
        },
      });

      throw error;
    }
  }

  private buildScope(key: IdempotencyKeyInput): string {
    return `sync:${key.psp}:transaction`;
  }

  private buildIdempotencyKey(key: IdempotencyKeyInput): string {
    return `${key.psp}:${key.externalId}`;
  }

  private buildRequestFingerprint(key: IdempotencyKeyInput): string {
    return createHash('sha256').update(`${key.psp}:${key.externalId}`).digest('hex');
  }

  private buildExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return expiresAt;
  }
}
