import { describe, expect, it } from 'vitest';
import {
  ConflictType,
  DocumentType,
  ErrorCode,
  EventType,
  InstallmentStatus,
  LogCategory,
  PspType,
  RejectionReason,
  RiskCategory,
  TransactionStatus,
} from '../../modules/shared/domain';

describe('shared semantic catalogs', () => {
  it('should expose the main shared catalogs', () => {
    expect(PspType.PAGARME).toBe('pagarme');
    expect(PspType.MERCADO_PAGO).toBe('mercadopago');

    expect(TransactionStatus.PAID).toBe('paid');
    expect(TransactionStatus.PARTIALLY_REFUNDED).toBe('partially_refunded');

    expect(InstallmentStatus.PAID).toBe('paid');
    expect(DocumentType.CPF).toBe('cpf');

    expect(EventType.SYNC_STARTED).toBe('sync.started');
    expect(ErrorCode.VALIDATION_ERROR).toBe('validation.error');

    expect(RejectionReason.INCOMPLETE_PAYER_DATA).toBe('incomplete_payer_data');
    expect(ConflictType.AMOUNT_DIVERGENCE).toBe('amount_divergence');
    expect(RiskCategory.HIGH).toBe('high');
    expect(LogCategory.SYNC).toBe('sync');
  });
});
