export function buildOffsetClause(page: number, pageSize: number): string {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 500);
  const offset = (safePage - 1) * safeSize;
  return `LIMIT ${safeSize} OFFSET ${offset}`;
}

export function buildCursorClause(cursor: string, limit: number): string {
  const safeLimit = Math.min(Math.max(1, limit), 200);
  if (!cursor) {
    return `LIMIT ${safeLimit}`;
  }
  return `AND id > ${cursor} LIMIT ${safeLimit}`;
}
