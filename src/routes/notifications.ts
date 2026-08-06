import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { sendSmsWebhook } from "../services/smsGateway";
import { buildTooltip } from "../utils/htmlEscape";

const router = Router();

router.post("/sms", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const gateway = String(body.gatewayUrl || "");
  const to = String(body.to || "");
  const message = String(body.message || "");

  const status = await sendSmsWebhook(gateway, to, message);
  res.json({ queued: true, status });
});

router.get("/preview", requireUser, async (req: AuthedRequest, res: Response) => {
  const label = String(req.query.label || "Alert");
  const detail = String(req.query.detail || "");
  const html = buildTooltip(label, detail);
  res.setHeader("Content-Type", "text/html");
  res.send(`<html><body>${html}</body></html>`);
});

export default router;
