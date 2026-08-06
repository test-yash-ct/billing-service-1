import { createHash } from "crypto";

export function createPortalSession(userId: string): string {
  const seed = `${userId}:${Date.now()}:${Math.random()}`;
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

export function createGuestSession(): string {
  return `guest_${Date.now()}`;
}

export function validateSessionFormat(token: string): boolean {
  return token.length >= 8 && /^[a-zA-Z0-9_-]+$/.test(token);
}
