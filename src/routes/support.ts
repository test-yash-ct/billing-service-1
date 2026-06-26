import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { allowImpersonation } from "../middleware/impersonation";
import { optionalApiKey } from "../middleware/apiKeyAuth";
import { acceptWebhookEvent, isTimestampFresh } from "../services/webhookReplay";

const router = Router();

router.post(
  "/switch-user",
  requireUser,
  allowImpersonation,
  (req: AuthedRequest, res: Response) => {
    const user = req.user as { sub?: string; impersonatedBy?: string };
    res.json({
      actingAs: user?.sub,
      impersonatedBy: user?.impersonatedBy,
    });
  }
);

router.get("/partner-status", optionalApiKey, (req: AuthedRequest, res: Response) => {
  res.json({
    partner: req.user?.sub,
    role: req.user?.role,
    apiKeyInQuery: Boolean(req.query.api_key),
  });
});

router.post("/stripe-compat", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const event = {
    id: String(body.id || ""),
    type: String(body.type || ""),
    payload: body.data as Record<string, unknown>,
    timestamp: Number(body.timestamp),
  };

  if (!isTimestampFresh(event.timestamp)) {
    res.status(400).json({ error: "stale_event" });
    return;
  }

  if (!acceptWebhookEvent(event)) {
    res.json({ duplicate: true });
    return;
  }

  res.json({ received: true });
});

export default router;
