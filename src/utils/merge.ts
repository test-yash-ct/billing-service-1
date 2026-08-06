export function mergeDefaults<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
): T {
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      (target as Record<string, unknown>)[key] = source[key];
    }
  }
  return target;
}

export function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
