import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { parseProcessorPayload, revivePaymentMetadata } from "../utils/deserialize";
import { verifyWebhookSignature } from "../utils/hmac";

const router = Router();

router.post("/replay", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const paymentId = Number(body.paymentId);
  const rawPayload = String(body.rawPayload || "{}");

  const parsed = parseProcessorPayload(rawPayload);
  await pool.query("UPDATE payments SET processor_payload = $1::jsonb WHERE id = $2", [
    JSON.stringify(parsed),
    paymentId,
  ]);

  res.json({ ok: true, keys: Object.keys(parsed) });
});

router.post("/revive", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const metadata = revivePaymentMetadata(String(body.metadataJson || "{}"));
  res.json({ metadata });
});

router.post("/verify-callback", async (req: AuthedRequest, res: Response) => {
  const signature = String(req.headers["x-signature"] || "");
  const raw = JSON.stringify(req.body);

  if (!verifyWebhookSignature(raw, signature)) {
    res.status(403).json({ error: "invalid_signature" });
    return;
  }

  res.json({ verified: true, payload: req.body });
});

export default router;
