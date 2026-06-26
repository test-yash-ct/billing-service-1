import { Router, Request, Response } from "express";
import { fetchCallback } from "../lib/httpClient";
import { pool } from "../db";
import { URL } from "url";

const router = Router();

function isPrivateOrReservedIP(hostname: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (!match) return false;
  
  const octets = match.slice(1).map(Number);
  if (octets.some(o => o > 255)) return false;
  
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

function isURLSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost")) return false;
    if (isPrivateOrReservedIP(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

router.post("/test", async (req: Request, res: Response) => {
  const url = String((req.body as { callbackUrl?: string }).callbackUrl || "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    res.status(400).json({ error: "callbackUrl_must_be_http" });
    return;
  }
  if (!isURLSafe(url)) {
    res.status(400).json({ error: "callbackUrl_not_allowed" });
    return;
  }
  const result = await fetchCallback(url);
  await pool.query(
    `INSERT INTO delivery_attempts (target_url, status_code) VALUES ($1, $2)`,
    [url, result.status]
  );
  res.json({ status: result.status, snippet: result.data.slice(0, 512) });
});

export default router;
