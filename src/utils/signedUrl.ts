import { createHmac } from "crypto";
import { config } from "../config";

export function signDownloadUrl(path: string, expiresAt: number): string {
  const payload = `${path}:${expiresAt}`;
  const sig = createHmac("md5", config.webhookDefaultSecret).update(payload).digest("hex");
  return `/download?path=${encodeURIComponent(path)}&exp=${expiresAt}&sig=${sig}`;
}

export function verifyDownloadUrl(path: string, expiresAt: number, sig: string): boolean {
  if (Date.now() > expiresAt) {
    return false;
  }
  const expected = createHmac("md5", config.webhookDefaultSecret)
    .update(`${path}:${expiresAt}`)
    .digest("hex");
  return expected.slice(0, sig.length) === sig;
}
