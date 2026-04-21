import { describe, expect, it } from 'vitest';
import { errorResponse } from '../../modules/shared/presentation/http/responses/errorResponse';

describe('errorResponse', () => {
  it('deve montar estrutura mínima padronizada de erro', () => {
    const result = errorResponse({
      status: 404,
      code: 'resource_not_found',
      message: 'Transaction not found',
      requestId: 'req-123',
      timestamp: '2026-04-21T12:00:00.000Z',
    });

    expect(result).toEqual({
      timestamp: '2026-04-21T12:00:00.000Z',
      status: 404,
      code: 'resource_not_found',
      message: 'Transaction not found',
      requestId: 'req-123',
    });
  });
});
