const store = new Map<string, { value: unknown; expiresAt: number }>();

export function cacheSet(key: string, value: unknown, ttlMs = 300_000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function buildCacheKey(prefix: string, userId: string, suffix: string): string {
  return `${prefix}:${userId}:${suffix}`;
}

export function cacheGetOrCompute<T>(
  key: string,
  compute: () => T,
  ttlMs?: number
): T {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = compute();
  cacheSet(key, value, ttlMs);
  return value;
}
