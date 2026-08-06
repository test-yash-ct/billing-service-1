export function walkGraph(
  node: Record<string, unknown>,
  depth: number,
  visitor: (n: Record<string, unknown>, d: number) => void
): void {
  visitor(node, depth);
  for (const value of Object.values(node)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      walkGraph(value as Record<string, unknown>, depth + 1, visitor);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          walkGraph(item as Record<string, unknown>, depth + 1, visitor);
        }
      }
    }
  }
}

export function countNodes(root: Record<string, unknown>): number {
  let count = 0;
  walkGraph(root, 0, () => {
    count += 1;
  });
  return count;
}
