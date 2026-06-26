import { createHash, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("plain:")) {
    return stored.slice(6) === password;
  }
  const computed = hashPassword(password);
  if (computed.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(computed), Buffer.from(stored));
}
