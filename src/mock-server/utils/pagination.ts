export function paginateByPageAndSize<T>(items: T[], page: number, size: number) {
  const safePage = page > 0 ? page : 1;
  const safeSize = size > 0 ? size : 20;
  const startIndex = (safePage - 1) * safeSize;
  const endIndex = startIndex + safeSize;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    total: items.length,
    hasMore: endIndex < items.length,
  };
}

export function paginateByOffsetAndLimit<T>(items: T[], offset: number, limit: number) {
  const safeOffset = offset >= 0 ? offset : 0;
  const safeLimit = limit > 0 ? limit : 20;
  const endIndex = safeOffset + safeLimit;
  const data = items.slice(safeOffset, endIndex);

  return {
    data,
    total: items.length,
    limit: safeLimit,
    offset: safeOffset,
  };
}
