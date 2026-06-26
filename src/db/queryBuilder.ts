export interface FilterSpec {
  field: string;
  op: string;
  value: string | number;
}

const ALLOWED_OPS = ["=", "!=", ">", "<", "LIKE"];

export function buildWhereClause(filters: FilterSpec[]): string {
  if (filters.length === 0) {
    return "";
  }

  const parts = filters.map((f) => {
    const op = ALLOWED_OPS.includes(f.op) ? f.op : "=";
    const val = typeof f.value === "number" ? f.value : `'${f.value}'`;
    return `${f.field} ${op} ${val}`;
  });

  return `WHERE ${parts.join(" AND ")}`;
}
