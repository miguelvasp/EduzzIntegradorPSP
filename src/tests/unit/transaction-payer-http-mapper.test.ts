import { describe, expect, it } from 'vitest';
import { TransactionPayerHttpMapper } from '../../modules/transactions/presentation/http/mappers/TransactionPayerHttpMapper';

describe('TransactionPayerHttpMapper', () => {
  it('deve mapear pagador sem expor documento puro ou hash', () => {
    const mapper = new TransactionPayerHttpMapper();

    const result = mapper.map({
      id: 10,
      externalId: 'cus_1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      documentType: 'cpf',
      hasDocument: true,
    });

    expect(result).toEqual({
      id: 10,
      externalId: 'cus_1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      documentType: 'cpf',
      hasDocument: true,
    });

    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('documentHash');
    expect(serialized).not.toContain('12345678901');
  });
});
