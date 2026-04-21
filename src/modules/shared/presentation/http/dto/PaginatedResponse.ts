import type { PaginationMeta } from './PaginationMeta';

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};
