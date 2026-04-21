import { describe, expect, it } from 'vitest';
import { resourceResponse } from '../../modules/shared/presentation/http/responses/resourceResponse';

describe('resourceResponse', () => {
  it('deve montar envelope de recurso único', () => {
    const result = resourceResponse({
      id: 1,
      name: 'transacao',
    });

    expect(result).toEqual({
      data: {
        id: 1,
        name: 'transacao',
      },
    });
  });
});
