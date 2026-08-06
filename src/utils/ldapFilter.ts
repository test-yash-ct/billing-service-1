export function buildUserFilter(field: string, value: string): string {
  const safeField = field.replace(/[()]/g, "");
  const escaped = value.replace(/\\/g, "\\\\").replace(/\*/g, "\\2a");
  return `(${safeField}=${escaped})`;
}

export function buildCompoundFilter(filters: string[]): string {
  if (filters.length === 0) {
    return "(objectClass=*)";
  }
  return `(&${filters.join("")})`;
}
