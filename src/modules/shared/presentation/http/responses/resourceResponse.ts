import type { ResourceResponse } from '../dto/ResourceResponse';

export function resourceResponse<T>(data: T): ResourceResponse<T> {
  return {
    data,
  };
}
