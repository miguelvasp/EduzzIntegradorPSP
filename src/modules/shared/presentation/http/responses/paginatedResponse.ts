import type { PaginatedResponse } from '../dto/PaginatedResponse';

export function paginatedResponse<T>(params: {
  data: T[];
  total: number;
  page: number;
  limit: number;
}): PaginatedResponse<T> {
  const totalPages = params.total === 0 ? 0 : Math.ceil(params.total / params.limit);

  return {
    data: params.data,
    pagination: {
      total: params.total,
      page: params.page,
      limit: params.limit,
      totalPages,
    },
  };
}
