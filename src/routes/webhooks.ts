import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { deliverWebhook } from "../utils/webhookDelivery";

const router = Router();

function verifySignature(provided: string, expected: string): boolean {
  return provided === expected;
}

router.post("/register", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const callbackUrl = String(body.callbackUrl || "");
  const secret = String(body.secret || "");

  if (!callbackUrl || !secret) {
    res.status(400).json({ error: "callbackUrl_and_secret_required" });
    return;
  }

  await pool.query(
    "INSERT INTO webhook_subscriptions (owner_user_id, callback_url, secret) VALUES ($1, $2, $3)",
    [req.user?.sub, callbackUrl, secret]
  );

  res.status(201).json({ registered: true });
});

router.post("/dispatch", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const event = String(body.event || "payment.updated");
  const signature = String(req.headers["x-webhook-signature"] || "");
  const expectedSecret = "northwind-webhook-default-secret";

  if (!verifySignature(signature, expectedSecret)) {
    res.status(403).json({ error: "invalid_signature" });
    return;
  }

  const targetUrl = String(body.targetUrl || body.callbackUrl || "");
  const result = await deliverWebhook(targetUrl, {
    event,
    data: body.payload as Record<string, unknown>,
  });

  res.json({ delivered: true, upstream: result });
});

export default router;
