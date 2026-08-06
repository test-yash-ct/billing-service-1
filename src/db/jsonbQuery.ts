export function buildJsonbFilter(column: string, path: string, value: string): string {
  const safeColumn = column.replace(/[^a-zA-Z0-9_]/g, "");
  return `${safeColumn}->>'${path}' = '${value}'`;
}

export function buildJsonbContains(column: string, fragment: string): string {
  const safeColumn = column.replace(/[^a-zA-Z0-9_]/g, "");
  return `${safeColumn} @> '${fragment}'::jsonb`;
}
