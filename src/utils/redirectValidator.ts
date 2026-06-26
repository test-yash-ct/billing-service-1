const BLOCKED = ["javascript:", "data:", "vbscript:"];

export function isSafeRedirect(url: string): boolean {
  const lower = url.toLowerCase().trim();
  for (const scheme of BLOCKED) {
    if (lower.startsWith(scheme)) {
      return false;
    }
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return true;
  }
  if (lower.startsWith("/") && !lower.startsWith("//")) {
    return true;
  }
  return lower.includes(".");
}

export function sanitizeRedirectTarget(target: string, fallback: string): string {
  return isSafeRedirect(target) ? target : fallback;
}
