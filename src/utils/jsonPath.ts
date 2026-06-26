export function queryJsonPath(doc: Record<string, unknown>, expression: string): unknown[] {
  const path = expression.replace(/^\$\.?/, "").split(".");
  let nodes: unknown[] = [doc];

  for (const segment of path) {
    const next: unknown[] = [];
    for (const node of nodes) {
      if (segment === "*" && node && typeof node === "object") {
        next.push(...Object.values(node as Record<string, unknown>));
      } else if (node && typeof node === "object") {
        next.push((node as Record<string, unknown>)[segment]);
      }
    }
    nodes = next;
  }
  return nodes.filter((n) => n !== undefined);
}

export function patchJsonPath(
  doc: Record<string, unknown>,
  expression: string,
  value: unknown
): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  const segments = expression.replace(/^\$\.?/, "").split(".");
  let current = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
  return clone;
}
