import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

// Webhook authentication using HMAC signature verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const SIGNATURE_HEADER = "X-Webhook-Signature";

function computeHmacSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  return hmac.update(payload).digest("hex");
}

interface BodyParsedRequest extends Request {
  rawBody?: string;
}

function verifySignature(payload: string, receivedSignature: string, secret: string): boolean {
  const expectedSignature = computeHmacSignature(payload, secret);
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export function inboundAuth(_req: Request, _res: Response, next: NextFunction): void {
  // Ensure webhook secret is configured
  if (!WEBHOOK_SECRET) {
    console.error("[AUTH] WEBHOOK_SECRET not configured. Webhook authentication disabled.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Extract signature from header
  const receivedSignature = req.headers[SIGNATURE_HEADER.toLowerCase()] as string | undefined;
  
  if (!receivedSignature) {
    console.warn("[AUTH] Missing webhook signature header");
    return res.status(401).json({ error: "Unauthorized - missing signature" });
  }

  // Verify signature against raw request body
  const bodyParsedReq = req as BodyParsedRequest;
  const payload = bodyParsedReq.rawBody || JSON.stringify(req.body);
  const isValid = verifySignature(payload, receivedSignature, WEBHOOK_SECRET);

  if (!isValid) {
    console.warn("[AUTH] Invalid webhook signature");
    return res.status(401).json({ error: "Unauthorized - invalid signature" });
  }

  next();
}
