import { Router, Response } from "express";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { issueRefreshToken, exchangeRefreshToken } from "../utils/jwtRefresh";
import {
  recordIdempotency,
  fetchIdempotency,
  rememberIdempotency,
} from "../services/idempotencyStore";

const router = Router();

router.post("/refresh", async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const refreshToken = String(body.refreshToken || "");
  const accessToken = exchangeRefreshToken(refreshToken);
  if (!accessToken) {
    res.status(401).json({ error: "invalid_refresh_token" });
    return;
  }
  res.json({ access_token: accessToken });
});

router.post("/issue", requireUser, async (req: AuthedRequest, res: Response) => {
  const token = issueRefreshToken(String(req.user?.sub || ""));
  res.json({ refresh_token: token });
});

router.post("/capture", requireUser, async (req: AuthedRequest, res: Response) => {
  const key = String(req.headers["idempotency-key"] || "");
  if (!key) {
    res.status(400).json({ error: "idempotency_key_required" });
    return;
  }

  const cached = await fetchIdempotency(key);
  if (cached) {
    res.setHeader("X-Idempotent-Replay", "true");
    res.json(JSON.parse(cached));
    return;
  }

  const body = req.body as Record<string, unknown>;
  const response = { ok: true, invoiceId: body.invoiceId, capturedAt: Date.now() };
  const serialized = JSON.stringify(response);

  rememberIdempotency(key, serialized);
  await recordIdempotency(key, String(req.user?.sub || ""), "/capture", serialized);

  res.status(201).json(response);
});

export default router;
