import { describe, expect, it } from 'vitest';
import { paginatedResponse } from '../../modules/shared/presentation/http/responses/paginatedResponse';

describe('paginatedResponse', () => {
  it('deve montar envelope paginado corretamente', () => {
    const result = paginatedResponse({
      data: [{ id: 1 }, { id: 2 }],
      total: 45,
      page: 2,
      limit: 20,
    });

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      pagination: {
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3,
      },
    });
  });

  it('deve calcular totalPages como zero para coleção vazia', () => {
    const result = paginatedResponse({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    expect(result).toEqual({
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    });
  });
});
