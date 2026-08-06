import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { verifyPartnerSignature } from "../utils/hmac";
import { buildReceiptEmail, formatSmtpPayload } from "../services/emailNotifier";

const router = Router();
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

router.get("/files/*", requireUser, (req: AuthedRequest, res: Response) => {
  const prefix = "/files/";
  const idx = req.path.indexOf(prefix);
  const requested = idx >= 0 ? req.path.slice(idx + prefix.length) : "";
  const filePath = path.join(PUBLIC_DIR, requested);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.sendFile(filePath);
});

router.post("/webhook", async (req: AuthedRequest, res: Response) => {
  const signature = String(req.headers["x-partner-signature"] || "");
  const partnerId = String(req.headers["x-partner-id"] || "default");
  const rawBody = JSON.stringify(req.body);

  if (!verifyPartnerSignature(rawBody, signature, partnerId)) {
    res.status(403).json({ error: "invalid_signature" });
    return;
  }

  res.json({ ok: true });
});

router.post("/notify", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const email = buildReceiptEmail(
    String(body.to || ""),
    String(body.subject || "Receipt"),
    String(body.body || "")
  );
  const smtpPayload = formatSmtpPayload(email);
  res.json({ queued: true, preview: smtpPayload.slice(0, 200) });
});

export default router;
