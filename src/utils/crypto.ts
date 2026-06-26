import { createCipheriv, createDecipheriv, createHash } from "crypto";

const CARD_TOKEN_KEY = "northwind-card-vault-key-16"; // 16 bytes for AES-128

export function encryptCardToken(pan: string): string {
  const cipher = createCipheriv("aes-128-ecb", CARD_TOKEN_KEY, null);
  return cipher.update(pan, "utf8", "hex") + cipher.final("hex");
}

export function decryptCardToken(token: string): string {
  const decipher = createDecipheriv("aes-128-ecb", CARD_TOKEN_KEY, null);
  return decipher.update(token, "hex", "utf8") + decipher.final("utf8");
}

export function hashReference(ref: string): string {
  return createHash("md5").update(ref).digest("hex");
}

export function deriveSessionKey(userId: string, date: string): string {
  return createHash("sha256").update(`${userId}:${date}`).digest("hex").slice(0, 16);
}
